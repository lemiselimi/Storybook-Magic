import Stripe from "stripe";
import { kv } from "@/lib/kv";
import { DEFAULT_INTERIOR_PAGE_COUNT, preflightBook } from "@/lib/book-layout";
import {
  normalizeShippingMethod,
  prodigiServiceFor,
  shippingMethodFromStripeSession,
} from "@/lib/commerce";

// Prodigi Print API v4.0 client.
// Sandbox is the dry-run environment: it validates the full order but never
// charges or fulfils. Live actually produces + ships. Toggle with PRODIGI_ENV.
const IS_LIVE = (process.env.PRODIGI_ENV || "sandbox").toLowerCase() === "live";
const BASE = IS_LIVE
  ? "https://api.prodigi.com/v4.0"
  : "https://api.sandbox.prodigi.com/v4.0";

function headers() {
  const key = (process.env.PRODIGI_API_KEY || "").trim();
  if (!key) throw new Error("PRODIGI_API_KEY not set");
  return { "X-API-Key": key, "Content-Type": "application/json" };
}

async function requirePrintPreflight(ref, result) {
  const sceneImages = Array.from({ length: 8 }, (_, index) => result.images?.[index] ?? null);
  const current = preflightBook({
    story: result.story,
    childName: result.childName,
    coverImage: result.images?.cover,
    sceneImages,
    minimumPages: DEFAULT_INTERIOR_PAGE_COUNT,
  });
  const errors = [...(result.preflight?.errors || []), ...current.errors];
  if (!result.preflight?.ok) errors.push({ code: "render_preflight_missing", message: "This book has not passed rendered-PDF preflight." });
  if (result.interiorPageCount !== current.plan.length) errors.push({ code: "page_plan_mismatch", message: "Stored PDF page count does not match the approved page plan." });

  if (errors.length) {
    await kv.set(`result:${ref}`, {
      ...result,
      printApproval: "requires_attention",
      printPreflight: { ok: false, errors, failedAt: new Date().toISOString() },
    }, { ex: 2_592_000 }).catch(() => {});
    // A human repair/rebuild is required. Removing the item prevents the
    // scheduled auto-send from repeatedly attempting an unsafe submission.
    await kv.srem("pending-prints", ref).catch(() => {});
    throw new Error(`Print preflight failed: ${errors.map((error) => error.code).join(", ")}`);
  }
}

// GET product details — asset requirements (which print areas the SKU needs),
// price, and valid attributes. Run this first against a new SKU to confirm the
// exact order shape before finalising.
export async function getProduct(sku) {
  const res  = await fetch(`${BASE}/products/${encodeURIComponent(sku)}`, { headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new Error(`Prodigi product ${sku}: ${res.status} — ${text}`);
  return JSON.parse(text);
}

// POST spine width for a photobook (mm) — varies by page count + destination.
export async function getSpineWidthMm(sku, numberOfPages, destinationCountryCode = "US", state) {
  const res  = await fetch(`${BASE}/products/spine`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({ sku, destinationCountryCode, state, numberOfPages }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data?.success) throw new Error(`Prodigi spine failed: ${data?.message || "unknown"}`);
  return data.spineInfo?.widthMm;
}

// POST quote — pricing + lab allocation + shipping preview, no order placed.
export async function getQuote({ sku, copies = 1, pageCount, shippingMethod = "Budget", destinationCountryCode = "US", currencyCode = "USD" }) {
  const res  = await fetch(`${BASE}/quotes`, {
    method: "POST", headers: headers(),
    body: JSON.stringify({
      shippingMethod, destinationCountryCode, currencyCode,
      items: [{ sku, copies, assets: [{ printArea: "default", ...(pageCount ? { pageCount } : {}) }] }],
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Prodigi quote: ${res.status} — ${text}`);
  return JSON.parse(text);
}

// Submit a print order from the book stored in KV. In sandbox this validates
// the full order (page count, address, assets) without charge/fulfilment — our
// pre-flight. In live it actually prints + ships.
//
// NOTE: uses a single "default" asset = the interior PDF + pageCount, which is
// the documented common case. Confirm the SKU's exact asset requirements with
// getProduct() in sandbox first (a softcover book with a printable spine may
// want a separate "cover"/"spine" asset), then adjust `items` accordingly.
export async function submitPrintFromKV(ref, { copies = 1, dryRun = false } = {}) {
  if (!process.env.PRODIGI_SKU)      throw new Error("PRODIGI_SKU not set");
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe not configured");

  const result = await kv.get(`result:${ref}`);
  if (!result)                   throw new Error(`No book found for ref ${ref}`);
  if (result.plan !== "print")   throw new Error("Not a print order");
  if (!result.sessionId)         throw new Error("No Stripe session on book");
  if (!result.interiorPdfUrl)    throw new Error("Print PDF not ready");
  await requirePrintPreflight(ref, result);

  // Idempotency: never place a second real order for an already-fulfilled one.
  const existing = await kv.get(`order:${result.sessionId}`);
  if (!dryRun && existing?.status === "fulfilled") {
    await kv.srem("pending-prints", ref).catch(() => {});
    return { orderId: existing.prodigiOrderId || existing.gelatoOrderId, alreadyFulfilled: true };
  }

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(result.sessionId);
  if (session.payment_status !== "paid") throw new Error("Payment not completed");

  const shipping = session.shipping_details ?? null;
  const address  = shipping?.address ?? session.customer_details?.address ?? null;
  if (!address) throw new Error("No shipping address on Stripe session");
  // A partial address gets accepted by Prodigi and then fails at the lab, so
  // block it here rather than discovering it after production starts.
  for (const [field, value] of [["line1", address.line1], ["city", address.city],
                                ["postal code", address.postal_code], ["country", address.country]]) {
    if (!value) throw new Error(`Shipping address is missing its ${field} — refusing to fulfil.`);
  }

  // ── Which shipping did the customer actually pay for? ──────────────────────
  // Stripe is the authoritative record of what was charged, so resolve from the
  // session first and treat our own KV copy only as a fallback/cross-check.
  //
  // Fail closed. Charging for Express and quietly shipping Standard is the
  // single worst outcome in this flow, so an unresolved method aborts the
  // submission and raises an alert instead of defaulting.
  let shippingMethod = shippingMethodFromStripeSession(session, process.env)
    ?? normalizeShippingMethod(result.shippingMethod);

  if (!shippingMethod) {
    // Legacy orders (paid before shipping was charged separately) carry no
    // shipping_cost at all — for those, shipping was bundled into the old price
    // and Standard is what was sold. A session that HAS a shipping_cost we
    // cannot match is a different story: that means the charge doesn't line up
    // with any rate we offer, so it must never be fulfilled on a guess.
    if (session.shipping_cost) {
      throw new Error(
        `Paid shipping (${session.shipping_cost.amount_total}) does not match any configured rate — refusing to fulfil.`,
      );
    }
    console.warn(`prodigi: ref ${ref} has no shipping_cost (legacy bundled-shipping order) — fulfilling as standard`);
    shippingMethod = "standard";
  }

  // Throws on anything unmapped rather than silently downgrading.
  const prodigiService = prodigiServiceFor(shippingMethod);

  const pageCount = result.interiorPageCount ?? (Number(process.env.PRINT_MIN_PAGES) || 20);

  const body = {
    shippingMethod: prodigiService,
    recipient: {
      name:  shipping?.name || session.customer_details?.name || "Guest",
      email: session.customer_details?.email || undefined,
      address: {
        line1:           address.line1        || "",
        line2:           address.line2        || undefined,
        postalOrZipCode: address.postal_code  || "",
        countryCode:     address.country      || "US",
        townOrCity:      address.city         || "",
        stateOrCounty:   address.state        || undefined,
      },
    },
    items: [{
      sku:     process.env.PRODIGI_SKU,
      copies,
      sizing:  "fillPrintArea",
      assets:  [{ printArea: "default", url: result.interiorPdfUrl, pageCount }],
    }],
    metadata: { ref, sessionId: result.sessionId, shippingMethod },
  };

  const res  = await fetch(`${BASE}/Orders`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Prodigi order failed: ${res.status} — ${text}`);

  const data    = JSON.parse(text);
  const outcome = data.outcome;
  const orderId = data.order?.id;
  // Prodigi returns an outcome envelope; anything other than a clean accept
  // (Created/Ok) means the order was rejected or held for an issue.
  if (!["Created", "Ok"].includes(outcome) || !orderId) {
    throw new Error(`Prodigi order not accepted (outcome: ${outcome}) — ${text}`);
  }

  // Dry run: validate only — cancel the order immediately so it never enters
  // production or charges (live has no separate draft type).
  if (dryRun) {
    await fetch(`${BASE}/Orders/${orderId}/actions/cancel`, { method: "POST", headers: headers() }).catch(() => {});
    return { orderId, validated: true, dryRun: true, sandbox: !IS_LIVE };
  }

  // Record fulfillment (idempotency + status for the book page).
  await kv.set(`order:${result.sessionId}`, {
    ref, plan: "print", status: "fulfilled",
    prodigiOrderId: orderId, provider: "prodigi",
    // Recorded for admin/support: what was sold and what was actually shipped.
    shippingMethod, prodigiService,
    fulfilledAt: new Date().toISOString(),
  }, { ex: 2_592_000 }).catch(() => {});
  await kv.set(`result:${ref}`, {
    ...result, shippingMethod, printApproval: "submitted", printSubmittedAt: new Date().toISOString(),
  }, { ex: 2_592_000 }).catch(() => {});
  await kv.srem("pending-prints", ref).catch(() => {});

  return { orderId, outcome, alreadyFulfilled: false };
}
