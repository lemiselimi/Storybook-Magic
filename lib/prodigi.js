import Stripe from "stripe";
import { kv } from "@/lib/kv";

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
export async function submitPrintFromKV(ref, { copies = 1 } = {}) {
  if (!process.env.PRODIGI_SKU)      throw new Error("PRODIGI_SKU not set");
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe not configured");

  const result = await kv.get(`result:${ref}`);
  if (!result)                   throw new Error(`No book found for ref ${ref}`);
  if (result.plan !== "print")   throw new Error("Not a print order");
  if (!result.sessionId)         throw new Error("No Stripe session on book");
  if (!result.interiorPdfUrl)    throw new Error("Print PDF not ready");

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(result.sessionId);
  if (session.payment_status !== "paid") throw new Error("Payment not completed");

  const shipping = session.shipping_details ?? null;
  const address  = shipping?.address ?? session.customer_details?.address ?? null;
  if (!address) throw new Error("No shipping address on Stripe session");

  const pageCount = result.interiorPageCount ?? (Number(process.env.GELATO_INTERIOR_PAGES) || 32);

  const body = {
    shippingMethod: process.env.PRODIGI_SHIPPING || "Budget",
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
    metadata: { ref, sessionId: result.sessionId },
  };

  const res  = await fetch(`${BASE}/Orders`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Prodigi order failed: ${res.status} — ${text}`);

  const data    = JSON.parse(text);
  const outcome = data.outcome;
  const orderId = data.order?.id;
  // Prodigi returns an outcome envelope; anything other than a clean accept
  // (Created/Ok) means the order was rejected or held for an issue.
  if (!["Created", "Ok"].includes(outcome)) {
    throw new Error(`Prodigi order not accepted (outcome: ${outcome}) — ${text}`);
  }
  return { prodigiOrderId: orderId, outcome, sandbox: !IS_LIVE };
}
