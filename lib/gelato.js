import Stripe from "stripe";
import { kv } from "@/lib/kv";

const GELATO_API_URL = "https://order.gelatoapis.com/v4/orders";

// Interior PDF is always padded to 20 pages by generate-book-pdf;
// Gelato requires pageCount for variable-page products.
const INTERIOR_PAGE_COUNT = 20;

// Submits a print order to Gelato using the PDFs already stored on result:{ref}.
// Idempotent: if the order was already fulfilled, returns it without resubmitting.
export async function submitPrintFromKV(ref, { dryRun = false } = {}) {
  if (!process.env.GELATO_API_KEY || !process.env.GELATO_PRODUCT_UID) throw new Error("Gelato not configured");
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe not configured");

  const result = await kv.get(`result:${ref}`);
  if (!result) throw new Error(`No book found for ref ${ref}`);
  if (result.plan !== "print") throw new Error("Not a print order");
  if (!result.sessionId) throw new Error("No Stripe session on book");
  if (!result.coverPdfUrl || !result.interiorPdfUrl) throw new Error("Print PDFs not ready");

  const existing = await kv.get(`order:${result.sessionId}`);
  if (!dryRun && existing?.status === "fulfilled") {
    await kv.srem("pending-prints", ref).catch(() => {});
    return { gelatoOrderId: existing.gelatoOrderId, alreadyFulfilled: true };
  }

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(result.sessionId);
  if (session.payment_status !== "paid") throw new Error("Payment not completed");

  const shipping = session.shipping_details ?? null;
  const address  = shipping?.address ?? session.customer_details?.address ?? null;
  if (!address) throw new Error("No shipping address on Stripe session");

  const nameParts = (shipping?.name || session.customer_details?.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "Guest";
  const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  const res = await fetch(GELATO_API_URL, {
    method:  "POST",
    headers: { "X-API-KEY": process.env.GELATO_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      orderType:           dryRun ? "draft" : "order",
      orderReferenceId:    `${result.sessionId}-${Date.now()}`,
      customerReferenceId: ref,
      currency:            "USD",
      items: [{
        itemReferenceId: `${ref}-1`,
        productUid:      process.env.GELATO_PRODUCT_UID,
        files: [
          { type: "cover",   url: result.coverPdfUrl    },
          { type: "default", url: result.interiorPdfUrl },
        ],
        quantity:  1,
        pageCount: result.interiorPageCount ?? INTERIOR_PAGE_COUNT,
        title: result.story?.title || "My Tiny Tales",
      }],
      shipmentMethodUid: "normal",
      shippingAddress: {
        firstName,
        lastName,
        addressLine1: address.line1        || "",
        addressLine2: address.line2        || undefined,
        city:         address.city         || "",
        state:        address.state        || undefined,
        postCode:     address.postal_code  || "",
        country:      address.country      || "US",
        email:        session.customer_details?.email || "",
        phone:        session.customer_details?.phone || undefined,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gelato order failed: ${res.status} — ${text}`);
  }
  const gelatoOrder = await res.json();
  // Dry run: Gelato validated the full payload (incl. page count) as a draft —
  // no production, no charge. Return without persisting.
  if (dryRun) return { dryRun: true, gelatoOrderId: gelatoOrder.id, validated: true };

  await kv.set(`order:${result.sessionId}`, {
    ref, plan: "print", status: "fulfilled",
    gelatoOrderId: gelatoOrder.id,
    fulfilledAt:   new Date().toISOString(),
  }, { ex: 2_592_000 }).catch(() => {});

  await kv.set(`result:${ref}`, {
    ...result,
    printApproval:    "submitted",
    printSubmittedAt: new Date().toISOString(),
  }, { ex: 2_592_000 }).catch(() => {});

  await kv.srem("pending-prints", ref).catch(() => {});

  return { gelatoOrderId: gelatoOrder.id, alreadyFulfilled: false };
}

// Admin alert email with a one-click retry link. Fire-and-forget.
export function sendPrintFailureAlert({ ref, sessionId, error, context }) {
  if (!process.env.RESEND_API_KEY) return;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";
  const retryLink = process.env.ADMIN_RETRY_KEY
    ? `<p><a href="${siteUrl}/api/retry-print?ref=${ref}&key=${process.env.ADMIN_RETRY_KEY}">Click here to retry the print order</a></p>`
    : "";
  fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:    "My Tiny Tales <hello@mytinytales.studio>",
      to:      ["hello@mytinytales.studio"],
      subject: `⚠️ Print submission failed (${context}) — ref: ${ref}`,
      html:    `<p><strong>Error:</strong> ${error}</p><p><strong>Ref:</strong> ${ref}</p><p><strong>Session:</strong> ${sessionId || "unknown"}</p>${retryLink}`,
    }),
  }).catch(() => {});
}
