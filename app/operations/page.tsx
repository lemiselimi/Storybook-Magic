"use client";
import { useRef, useState } from "react";
import styles from "./page.module.css";

type Order = { ref: string; plan: string; stage: string; issues: string[]; needsAttention: boolean; completedImages: number; totalImages: number; canRetry: boolean; checkedAt: string; recovery?: {at: string; ok: boolean} };
type Email = { id: string; purpose: string; status: string; needsAttention: boolean; updatedAt: string };
type Snapshot = { falBalance?: { status: string; balance?: number; threshold?: number; checkedAt: string; issue?: string } | null; orders: Order[]; emails: Email[]; coverage: string; run: null | { completedAt: string; ok: boolean; error?: string; alert?: string; scanComplete: boolean; reconciliationComplete: boolean }; configuration: { emailEvents: boolean; alerts: boolean; paymentReconciliation: boolean; cronConfigured: boolean } };

export default function OperationsPage() {
  const key = useRef("");
  const [data, setData] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(true);
  async function load() {
    const response = await fetch("/api/operations", { headers: { Authorization: `Bearer ${key.current}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (response.status === 401) { setData(null); throw new Error("The access key was not accepted. Ask the site owner for the operations key."); }
    if (!response.ok) throw new Error("The order desk is temporarily unavailable. Please try again.");
    setData(await response.json());
  }
  async function action(action?: string, ref?: string) {
    setBusy(true); setMessage("");
    try {
      if (action) {
        const response = await fetch("/api/operations", { method: "POST", headers: { Authorization: `Bearer ${key.current}`, "Content-Type": "application/json" }, body: JSON.stringify({ action, ref }), signal: AbortSignal.timeout(65_000) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Action failed. Please refresh before retrying.");
        setMessage(result.busy ? "A check is already running. Refresh shortly." : action === "retry" ? "Recovery requested. Completed illustrations are preserved. Run a check shortly to see progress." : "Order check finished.");
      }
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Connection failed. Please try again."); }
    finally { setBusy(false); }
  }
  const issues = data?.orders.filter(o => o.needsAttention) || [];
  const emailIssues = data?.emails.filter(e => e.needsAttention) || [];
  const stale = !data?.run?.completedAt || Date.now() - Date.parse(data.run.completedAt) > 25 * 60_000;
  return <main className={styles.desk}>
    <header className={styles.header}><div><p className={styles.eyebrow}>My Tiny Tales · Private operations</p><h1>Order desk</h1><p>Keep every story moving.</p></div>{data && <button disabled={busy} onClick={() => { key.current = ""; setData(null); setMessage(""); }}>Lock dashboard</button>}</header>
    {!data ? <form className={styles.login} onSubmit={event => { event.preventDefault(); void action(); }}>
      <h2>Open your order dashboard</h2><p>Use your private operations key. It stays in memory for this tab and clears when you leave or refresh.</p>
      <label htmlFor="access-key">Operations key</label><input id="access-key" type="password" autoComplete="off" required minLength={32} onChange={event => { key.current = event.target.value; }} />
      <button disabled={busy} type="submit">{busy ? "Opening…" : "Open dashboard"}</button>
    </form> : <>
      <div className={styles.toolbar}><p>Last check: {data.run?.completedAt ? new Date(data.run.completedAt).toLocaleString() : "Not run yet"}</p><div><button disabled={busy} onClick={() => void action()}>Refresh</button><button disabled={busy} onClick={() => void action("check")}>{busy ? "Working…" : "Run order check"}</button></div></div>
      {(stale || !data.run?.ok) && <p className={styles.warning}>Monitoring needs attention. {data.run?.error || "A recent successful scheduled check has not been recorded."} These statuses may be out of date.</p>}
      {data.run?.alert === "failed" && <p className={styles.warning}>The last operator alert could not be sent. Review the issues below.</p>}
      <div className={styles.summary}><article><strong>{issues.length}</strong><span>Orders needing attention</span></article><article><strong>{emailIssues.length}</strong><span>Email issues</span></article><article><strong>{data.orders.length}</strong><span>Orders in this view</span></article></div>
      <section className={styles.section}><div className={styles.sectionTitle}><h2>Orders</h2><label><input type="checkbox" checked={attentionOnly} onChange={e => setAttentionOnly(e.target.checked)} /> Needs attention only</label></div>
        {(attentionOnly ? issues : data.orders).length === 0 && <p>{data.orders.length ? "No orders need attention in this view." : "No orders checked yet. Run a check to load recent paid orders."}</p>}
        {(attentionOnly ? issues : data.orders).map(order => <article className={styles.order} key={order.ref}>
          <div><span className={order.needsAttention ? styles.badgeIssue : styles.badge}>{order.stage}</span><h3>Order {order.ref.slice(0, 8)}</h3><p className={styles.ref}>{order.ref}</p><p>{order.plan} · {order.completedImages}/{order.totalImages || "?"} illustrations</p><small>Checked {new Date(order.checkedAt).toLocaleString()}</small></div>
          <div>{order.issues.map(issue => <p key={issue}>{issue}</p>)}{order.recovery && <p>Last recovery {order.recovery.ok ? "requested" : "unsuccessful"}: {new Date(order.recovery.at).toLocaleString()}</p>}{order.canRetry && <button disabled={busy} onClick={() => void action("retry", order.ref)}>Retry unfinished illustrations</button>}</div>
        </article>)}
      </section>
      <section className={styles.section}><h2>Email delivery</h2><p>Delivery means the receiving mail server accepted the email. It does not confirm that someone read it. Customer replies and Stripe receipts are not monitored here.</p>
        {!data.configuration.emailEvents && <p className={styles.warning}>Delivery tracking is not connected. Configure the signed Resend webhook to confirm deliveries and bounces.</p>}
        {data.emails.length === 0 ? <p>No tracked emails yet.</p> : data.emails.map(email => <article className={styles.email} key={email.id}><div><strong>{email.purpose}</strong><p className={styles.ref}>{email.id}</p></div><span className={email.needsAttention ? styles.badgeIssue : styles.badge}>{email.status}</span></article>)}
      </section>
      <section className={styles.section}><h2>Illustration credits</h2><p>{data.falBalance?.balance !== undefined ? `fal.ai balance: ${data.falBalance.balance.toFixed(2)} USD. Alert threshold: ${data.falBalance.threshold}.` : data.falBalance?.status === "unavailable" ? "Balance unavailable — available credits are unknown." : "Balance monitoring is not connected. A billing-read key is required."}</p>{data.falBalance?.issue && <p className={styles.warning}>{data.falBalance.issue}</p>}{data.falBalance?.checkedAt && <small>Checked {new Date(data.falBalance.checkedAt).toLocaleString()}</small>}<p>Read-only monitoring. No automatic top-ups or charges.</p></section><section className={styles.section}><h2>Monitor setup</h2><p>Payment cross-check: {data.configuration.paymentReconciliation ? "configured" : "not connected"} · Email alerts: {data.configuration.alerts ? "configured" : "off"} · Scheduled-check credentials: {data.configuration.cronConfigured ? "configured" : "missing"}</p><p>Recent sweep: order scan {data.run?.scanComplete ? "complete" : "not complete"}; payment cross-check {data.run?.reconciliationComplete ? "complete" : "not complete"}. Larger histories continue on the next check.</p><p>{data.coverage}</p><p>Checks do not charge cards, submit print orders, or send customer replies. “Submitted to printer” does not mean shipped or delivered.</p></section>
    </>}
    <p role="status" aria-live="polite" className={styles.message}>{message}</p>
  </main>;
}
