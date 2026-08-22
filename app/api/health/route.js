import { kv, KV_REST_URL } from "@/lib/kv";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Temporary diagnostic: GET /api/health?key=<CRON_SECRET>
// Reports whether KV and Stripe are actually reachable, and which env vars are
// present (booleans only — never values). Remove after debugging.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET.trim()) {
    return new Response("Unauthorized", { status: 401 });
  }

  const out = { time: new Date().toISOString(), env: {}, kv: {}, stripe: {} };

  out.env = {
    KV_REST_API_URL:       !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN:     !!process.env.KV_REST_API_TOKEN,
    STRIPE_SECRET_KEY:     !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    // host only (never the token) — helps spot a dead/decommissioned endpoint
    KV_HOST: (() => { try { return new URL(KV_REST_URL).host; } catch { return null; } })(),
    STRIPE_KEY_MODE: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live"
                   : process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "test" : "unknown",
  };

  // KV round-trip
  try {
    const k = `__health__:${Date.now()}`;
    await kv.set(k, "ok", { ex: 60 });
    const v = await kv.get(k);
    out.kv = { ok: v === "ok", readBack: v };
  } catch (e) {
    out.kv = { ok: false, error: e?.message || String(e) };
  }

  // Stripe reachability (lightweight call)
  try {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("no STRIPE_SECRET_KEY");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const bal = await stripe.balance.retrieve();
    out.stripe = { ok: true, livemode: bal.livemode };
  } catch (e) {
    out.stripe = { ok: false, error: e?.message || String(e) };
  }

  return Response.json(out);
}
