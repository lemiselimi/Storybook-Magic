import { kv, KV_REST_URL } from "@/lib/kv";
import { submitPrintFromKV } from "@/lib/gelato";
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
    GELATO_API_KEY:     !!process.env.GELATO_API_KEY,
    GELATO_PRODUCT_UID: process.env.GELATO_PRODUCT_UID || null, // product id, not a secret
    RESEND_API_KEY:     !!process.env.RESEND_API_KEY,
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

  // Gelato reachability (validates the API key against the product catalog)
  try {
    if (!process.env.GELATO_API_KEY) throw new Error("no GELATO_API_KEY");
    const r = await fetch("https://product.gelatoapis.com/v3/catalogs", {
      headers: { "X-API-KEY": process.env.GELATO_API_KEY },
    });
    out.gelato = { ok: r.ok, status: r.status };
    if (!r.ok) out.gelato.body = (await r.text()).slice(0, 200);
  } catch (e) {
    out.gelato = { ok: false, error: e?.message || String(e) };
  }

  // Inspect a specific print order's readiness (?ref=…, else the first pending)
  try {
    const pending = (await kv.smembers("pending-prints").catch(() => [])) || [];
    out.pendingPrints = pending;
    const ref = searchParams.get("ref") || pending[0];
    if (ref) {
      const res = await kv.get(`result:${ref}`);
      out.order = res ? {
        ref, plan: res.plan, status: res.status, printApproval: res.printApproval,
        hasCoverPdf: !!res.coverPdfUrl, hasInteriorPdf: !!res.interiorPdfUrl,
        hasSession: !!res.sessionId,
      } : { ref, notFound: true };
    }
  } catch (e) {
    out.orderError = e?.message || String(e);
  }

  // Regenerate a stuck order's PDF with the corrected page count (?regenpdf=1)
  if (searchParams.get("regenpdf") === "1") {
    const ref = searchParams.get("ref") || (out.pendingPrints && out.pendingPrints[0]);
    try {
      const res = await kv.get(`result:${ref}`);
      if (!res) throw new Error("order not found");
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";
      const pageUrls = [0, 1, 2, 3, 4, 5].map(i => res.images?.[i] ?? null);
      const pdfRes = await fetch(`${siteUrl}/api/generate-book-pdf`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverFalUrl: res.images?.cover, pageFalUrls: pageUrls, story: res.story, childName: res.childName }),
      });
      const pj = await pdfRes.json();
      if (!pj.interiorPdfUrl) throw new Error(pj.error || "pdf gen failed");
      await kv.set(`result:${ref}`, { ...res, coverPdfUrl: pj.coverPdfUrl, interiorPdfUrl: pj.interiorPdfUrl });
      const bytes = new Uint8Array(await (await fetch(pj.interiorPdfUrl)).arrayBuffer());
      const { PDFDocument } = await import("pdf-lib");
      out.regenpdf = { ok: true, ref, interiorPages: (await PDFDocument.load(bytes)).getPageCount() };
    } catch (e) {
      out.regenpdf = { ok: false, error: e?.message || String(e) };
    }
  }

  // Attempt the Gelato submission (?tryprint=1). Add &dry=1 to validate as a
  // free Gelato draft (no production, no charge) instead of a real order.
  if (searchParams.get("tryprint") === "1") {
    const ref = searchParams.get("ref") || (out.pendingPrints && out.pendingPrints[0]);
    const dryRun = searchParams.get("dry") === "1";
    try {
      const r = await submitPrintFromKV(ref, { dryRun });
      out.tryprint = { ok: true, ref, dryRun, ...r };
    } catch (e) {
      out.tryprint = { ok: false, ref, dryRun, error: e?.message || String(e) };
    }
  }

  // Fetch the Gelato product spec + prices to discover valid page counts (?gelatoinfo=1)
  if (searchParams.get("gelatoinfo") === "1") {
    const uid = process.env.GELATO_PRODUCT_UID;
    const h = { "X-API-KEY": process.env.GELATO_API_KEY };
    try {
      const pr = await fetch(`https://product.gelatoapis.com/v3/products/${uid}/prices`, { headers: h });
      const txt = await pr.text();
      // Pull out the distinct pageCount values the price list exposes
      const counts = [...new Set([...txt.matchAll(/"pageCount":\s*(\d+)/g)].map(m => Number(m[1])))].sort((a, b) => a - b);
      out.gelatoPageCounts = counts;
      out.pricesStatus = pr.status;
    } catch (e) { out.gelatoInfoError = e?.message || String(e); }
  }

  return Response.json(out);
}
