import { createHash } from "node:crypto";
import Stripe from "stripe";
import { Resend } from "resend";
import { kv } from "@/lib/kv";
import { canRetryGeneration } from "@/lib/generation-recovery";
import { orderHealth, EMAIL_PROBLEMS, emailLabel } from "@/lib/order-health";

const TTL = 30 * 86_400;

async function inspectOrder(order, sessionId) {
  if (!order.ref) return;
  const [result, failure, recovery] = await Promise.all([kv.get(`result:${order.ref}`), kv.get(`watchdog:print-failure:${order.ref}`), kv.get(`watchdog:recovery:${order.ref}`)]);
  const health = orderHealth(order, result, failure);
  const source = result && canRetryGeneration(result) ? await kv.get(`book:${order.ref}`) : null;
  const record = { ref: order.ref, plan: order.plan || result?.plan || "unknown", ...health,
    completedImages: Object.values(result?.images || {}).filter(Boolean).length,
    totalImages: result?.totalJobs || 0, canRetry: !!source?.referenceUrl && !!result?.accessToken,
    recovery: recovery ? { at: recovery.at, ok: recovery.ok } : null,
    checkedAt: new Date().toISOString(), paidAt: order.paidAt || result?.createdAt || null };
  // Keep the payment identifier server-side; no access tokens, addresses or child photos in the dashboard.
  await kv.set(`watchdog:order:${order.ref}`, { ...record, sessionId }, { ex: TTL });
  await kv.zadd("watchdog:orders", { score: Date.parse(record.paidAt) || Date.now(), member: order.ref });
  if (health.needsAttention) await kv.zadd("watchdog:attention", { score: Date.now(), member: order.ref });
  else await kv.zrem("watchdog:attention", order.ref);
}

export async function watchdogSnapshot() {
  const [refs, attentionRefs, mailIds, run] = await Promise.all([
    kv.zrange("watchdog:orders", 0, 99, { rev: true }), kv.zrange("watchdog:attention", 0, 99, { rev: true }),
    kv.zrange("watchdog:mail", 0, 99, { rev: true }), kv.get("watchdog:last-run"),
  ]);
  const allRefs = [...new Set([...attentionRefs, ...refs])];
  const orders = (await Promise.all(allRefs.map(ref => kv.get(`watchdog:order:${ref}`))))
    .filter(Boolean).map(record => { const publicRecord = { ...record }; delete publicRecord.sessionId; return publicRecord; });
  const emails = (await Promise.all(mailIds.map(async id => {
    const [meta, event] = await Promise.all([kv.get(`watchdog:mail-meta:${id}`), kv.get(`watchdog:mail-event:${id}`)]);
    if (!meta && !event) return null;
    const type = meta?.sendFailed ? "send_failed" : event?.type || "unknown";
    return { id, purpose: meta?.purpose || "Transactional email", status: emailLabel(type),
      needsAttention: EMAIL_PROBLEMS.has(type), updatedAt: event?.at ? new Date(event.at).toISOString() : meta?.sentAt };
  }))).filter(Boolean);
  return { orders, emails, run, coverage: "Most recent 100 orders, up to 100 attention items, and 100 emails. Records retained for 30 days.",
    configuration: { emailEvents: !!process.env.RESEND_WEBHOOK_SECRET, alerts: !!process.env.WATCHDOG_ALERT_EMAIL && !!process.env.RESEND_API_KEY,
      paymentReconciliation: !!process.env.STRIPE_SECRET_KEY, cronConfigured: !!process.env.CRON_SECRET },
  };
}

async function alertOnChange(snapshot) {
  if (!process.env.WATCHDOG_ALERT_EMAIL || !process.env.RESEND_API_KEY) return "disabled";
  const orderIssues = snapshot.orders.filter(o => o.needsAttention).map(o => `${o.ref}: ${o.issues.join("; ")}`);
  const emailIssues = snapshot.emails.filter(e => e.needsAttention).map(e => `${e.id}: ${e.status}`);
  const lines = [...orderIssues, ...emailIssues].sort();
  const fingerprint = createHash("sha256").update(JSON.stringify(lines)).digest("hex");
  if (await kv.get("watchdog:alert-fingerprint") === fingerprint) return "unchanged";
  if (lines.length) {
    const { error, data } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "My Tiny Tales <hello@mytinytales.studio>", to: process.env.WATCHDOG_ALERT_EMAIL,
      subject: `My Tiny Tales: ${lines.length} items need attention`,
      text: `Open your private order dashboard: https://mytinytales.studio/operations\n\n${lines.join("\n")}\n\nNo payment or print order was retried by this check.`,
    }, { idempotencyKey: `watchdog-${fingerprint}-${new Date().toISOString().slice(0, 10)}` });
    if (error || !data?.id) throw new Error("Operator alert could not be sent");
  }
  await kv.set("watchdog:alert-fingerprint", fingerprint, { ex: TTL });
  return lines.length ? "sent" : "clear";
}

export async function runWatchdog() {
  const owner = crypto.randomUUID();
  if (!await kv.set("watchdog:run-lock", owner, { nx: true, ex: 90 })) return { busy: true };
  const startedAt = new Date().toISOString();
  let checked = 0;
  try {
    // Cursor-based scans include existing orders without requiring a migration or an unbounded KEYS call.
    let cursor = Number(await kv.get("watchdog:scan-cursor")) || 0;
    const [nextCursor, keys] = await kv.scan(cursor, { match: "order:*", count: 100 });
    for (let offset = 0; offset < keys.length; offset += 10) {
      await Promise.all(keys.slice(offset, offset + 10).map(async key => {
        const order = await kv.get(key);
        if (order) { await inspectOrder(order, key.slice(6)); checked++; }
      }));
    }
    await kv.set("watchdog:scan-cursor", Number(nextCursor));
    cursor = Number(nextCursor);

    // Reconcile Stripe itself: a completely missed payment webhook otherwise has no local order to scan.
    let reconciliationComplete = false;
    if (process.env.STRIPE_SECRET_KEY) {
      const checkpoint = await kv.get("watchdog:stripe-cursor");
      const since = checkpoint?.since || Math.floor(Date.now() / 1000) - TTL;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 8_000, maxNetworkRetries: 0 });
      const sessions = await stripe.checkout.sessions.list({ limit: 100, created: { gte: since }, ...(checkpoint?.after ? { starting_after: checkpoint.after } : {}) });
      for (let offset = 0; offset < sessions.data.length; offset += 10) {
        await Promise.all(sessions.data.slice(offset, offset + 10).filter(s => s.payment_status === "paid" && s.metadata?.ref).map(async s => {
          const saved = await kv.get(`order:${s.id}`);
          await inspectOrder(saved || { ref: s.metadata.ref, plan: s.metadata.plan, paidAt: new Date(s.created * 1000).toISOString() }, s.id);
          checked++;
        }));
      }
      reconciliationComplete = !sessions.has_more;
      if (sessions.has_more) await kv.set("watchdog:stripe-cursor", { since, after: sessions.data.at(-1).id }, { ex: TTL });
      else await kv.del("watchdog:stripe-cursor");
    }
    const cutoff = Date.now() - TTL * 1000;
    await Promise.all(["watchdog:orders", "watchdog:attention", "watchdog:mail"].map(key => kv.zremrangebyscore(key, "-inf", cutoff)));
    const state = { startedAt, completedAt: new Date().toISOString(), ok: true, checked, scanComplete: cursor === 0, reconciliationComplete };
    await kv.set("watchdog:last-run", state, { ex: TTL });
    const snapshot = await watchdogSnapshot();
    try { state.alert = await alertOnChange(snapshot); }
    catch { state.alert = "failed"; }
    await kv.set("watchdog:last-run", state, { ex: TTL });
    return state;
  } catch (error) {
    await kv.set("watchdog:last-run", { startedAt, completedAt: new Date().toISOString(), ok: false, checked,
      error: "Monitoring could not finish. Check service credentials and logs; order status may be stale." }, { ex: TTL }).catch(() => {});
    throw error;
  } finally {
    await kv.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", ["watchdog:run-lock"], [owner]).catch(() => {});
  }
}
