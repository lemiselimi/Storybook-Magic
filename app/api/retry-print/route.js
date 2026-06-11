import Stripe from "stripe";
import { kv } from "@vercel/kv";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GELATO_API_URL = "https://order.gelatoapis.com/v4/orders";

// Admin-only: re-submit a failed print order using data already stored in KV.
// Usage: GET /api/retry-print?ref=<bookRef>&key=<ADMIN_RETRY_KEY>[&force=1]
export async function GET(request) {
  const adminKey = process.env.ADMIN_RETRY_KEY;
  if (!adminKey) {
    return Response.json({ error: "ADMIN_RETRY_KEY not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== adminKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ref   = searchParams.get("ref");
  const force = searchParams.get("force") === "1";
  if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

  const gelatoKey = process.env.GELATO_API_KEY;
  if (!gelatoKey || !process.env.GELATO_PRODUCT_UID) {
    return Response.json({ error: "Gelato credentials not configured" }, { status: 503 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  try {
    const result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ error: `No book found for ref ${ref}` }, { status: 404 });
    if (!result.sessionId) {
      return Response.json({ error: "Book has no Stripe session attached" }, { status: 400 });
    }

    // Refuse double-submission unless forced
    const existingOrder = await kv.get(`order:${result.sessionId}`);
    if (existingOrder?.status === "fulfilled" && !force) {
      return Response.json({
        ok:            false,
        error:         "Order already fulfilled — add &force=1 to resubmit anyway",
        gelatoOrderId: existingOrder.gelatoOrderId,
        fulfilledAt:   existingOrder.fulfilledAt,
      }, { status: 409 });
    }

    // Reuse stored PDFs; regenerate from stored images only if they're missing
    let { coverPdfUrl, interiorPdfUrl } = result;
    if (!coverPdfUrl || !interiorPdfUrl) {
      const images = result.images || {};
      if (!images["cover"]) {
        return Response.json({ error: "No PDFs and no images stored — cannot retry" }, { status: 400 });
      }
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";
      const pdfRes = await fetch(`${siteUrl}/api/generate-book-pdf`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          coverFalUrl: images["cover"],
          pageFalUrls: [0, 1, 2, 3, 4, 5].map(i => images[i] ?? null),
          story:       result.story,
          childName:   result.childName,
        }),
      });
      if (!pdfRes.ok) {
        const err = await pdfRes.json().catch(() => ({}));
        throw new Error(`PDF generation failed: ${err.error || pdfRes.status}`);
      }
      ({ coverPdfUrl, interiorPdfUrl } = await pdfRes.json());

      await kv.set(`result:${ref}`, {
        ...result, coverPdfUrl, interiorPdfUrl, status: "ready",
      }, { ex: 2_592_000 }).catch(() => {});
    }

    // Shipping address from the original Stripe checkout session
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(result.sessionId);
    if (session.payment_status !== "paid") {
      return Response.json({ error: "Payment not completed on session" }, { status: 402 });
    }
    const shipping = session.shipping_details ?? null;
    const address  = shipping?.address ?? session.customer_details?.address ?? null;
    if (!address) {
      return Response.json({ error: "No shipping address on Stripe session" }, { status: 400 });
    }

    const nameParts = (shipping?.name || session.customer_details?.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "Guest";
    const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

    const gelatoRes = await fetch(GELATO_API_URL, {
      method:  "POST",
      headers: { "X-API-KEY": gelatoKey, "Content-Type": "application/json" },
      body:    JSON.stringify({
        orderType:           "order",
        orderReferenceId:    `${result.sessionId}-${Date.now()}`,
        customerReferenceId: ref,
        currency:            "USD",
        items: [{
          itemReferenceId: `${ref}-1`,
          productUid:      process.env.GELATO_PRODUCT_UID,
          files: [
            { type: "cover",   url: coverPdfUrl    },
            { type: "default", url: interiorPdfUrl },
          ],
          quantity: 1,
          pageCount: 20,
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

    if (!gelatoRes.ok) {
      const text = await gelatoRes.text();
      throw new Error(`Gelato order failed: ${gelatoRes.status} — ${text}`);
    }

    const gelatoOrder = await gelatoRes.json();
    console.log("retry-print: Gelato order created:", gelatoOrder.id, "ref:", ref);

    await kv.set(`order:${result.sessionId}`, {
      ref, plan: "print", status: "fulfilled",
      gelatoOrderId: gelatoOrder.id,
      fulfilledAt:   new Date().toISOString(),
      retried:       true,
    }, { ex: 2_592_000 }).catch(() => {});

    return Response.json({ ok: true, gelatoOrderId: gelatoOrder.id, ref });

  } catch (err) {
    console.error("retry-print error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
