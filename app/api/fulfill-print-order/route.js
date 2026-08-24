import Stripe from "stripe";
import { kv } from "@/lib/kv";

export const maxDuration = 60;

const GELATO_API_URL = "https://order.gelatoapis.com/v4/orders";

async function createGelatoOrder(apiKey, { coverPdfUrl, interiorPdfUrl, pageCount, shippingAddress, contactEmail, title, externalId }) {
  const nameParts = (shippingAddress.name || "").trim().split(/\s+/);
  const firstName  = nameParts[0] || "Guest";
  const lastName   = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

  const body = {
    orderType:           "order",
    orderReferenceId:    externalId,
    customerReferenceId: externalId,
    currency:            "USD",
    items: [{
      itemReferenceId: `${externalId}-1`,
      productUid:      process.env.GELATO_PRODUCT_UID,
      files: [
        { type: "cover",   url: coverPdfUrl    },
        { type: "default", url: interiorPdfUrl },
      ],
      quantity: 1,
      pageCount: pageCount || Number(process.env.GELATO_INTERIOR_PAGES) || 32,
      title,
    }],
    shipmentMethodUid: "normal",
    shippingAddress: {
      firstName,
      lastName,
      addressLine1: shippingAddress.street1   || "",
      addressLine2: shippingAddress.street2   || undefined,
      city:         shippingAddress.city      || "",
      state:        shippingAddress.state_code || undefined,
      postCode:     shippingAddress.postcode  || "",
      country:      shippingAddress.country_code || "US",
      email:        contactEmail,
      phone:        shippingAddress.phone_number || undefined,
    },
  };

  const res = await fetch(GELATO_API_URL, {
    method:  "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gelato order failed: ${res.status} — ${text}`);
  }
  return res.json();
}

export async function POST(request) {
  const gelatoKey = process.env.GELATO_API_KEY;
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }
  if (!gelatoKey || !process.env.GELATO_PRODUCT_UID) {
    return Response.json({ error: "Gelato credentials not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { sessionId, coverFalUrl, pageFalUrls, story, childName, theme } = body;
  if (!sessionId) return Response.json({ error: "sessionId required" }, { status: 400 });

  try {
    // ── 1. Verify payment & get shipping address from Stripe ──────────────────
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return Response.json({ error: "Payment not completed" }, { status: 402 });
    }

    const shipping = session.shipping_details ?? null;
    const address  = shipping?.address ?? session.customer_details?.address ?? null;

    if (!address) {
      return Response.json({ error: "No shipping address on Stripe session" }, { status: 400 });
    }

    const contactEmail = session.customer_details?.email || "";

    const shippingAddress = {
      name:         shipping?.name || session.customer_details?.name || "",
      street1:      address.line1 || "",
      street2:      address.line2 || "",
      city:         address.city || "",
      state_code:   address.state || "",
      postcode:     address.postal_code || "",
      country_code: address.country || "US",
      phone_number: session.customer_details?.phone || "",
    };

    // ── 2. Generate print-ready PDFs ──────────────────────────────────────────
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";

    const pdfRes = await fetch(`${origin}/api/generate-book-pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ coverFalUrl, pageFalUrls, story, childName, theme }),
    });

    if (!pdfRes.ok) {
      const err = await pdfRes.json().catch(() => ({}));
      throw new Error(`PDF generation failed: ${err.error || pdfRes.status}`);
    }

    const { coverPdfUrl, interiorPdfUrl, interiorPageCount } = await pdfRes.json();

    // ── 3. Submit print order to Gelato ───────────────────────────────────────
    const capName = childName
      ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
      : "a special child";

    const gelatoOrder = await createGelatoOrder(gelatoKey, {
      coverPdfUrl,
      interiorPdfUrl,
      pageCount: interiorPageCount,
      shippingAddress,
      contactEmail,
      title:      `My Tiny Tales — ${capName}'s Story`,
      externalId: `${sessionId}-${Date.now()}`,
    });

    console.log("Gelato order created:", gelatoOrder.id, "status:", gelatoOrder.fulfillmentStatus);

    // Update KV order record
    try {
      const existing = await kv.get(`order:${sessionId}`) || {};
      await kv.set(`order:${sessionId}`, {
        ...existing,
        status:       "fulfilled",
        gelatoOrderId: gelatoOrder.id,
        fulfilledAt:  new Date().toISOString(),
      }, { ex: 2_592_000 });
    } catch (kvErr) {
      console.error("KV update failed (non-fatal):", kvErr.message);
    }

    return Response.json({
      ok:            true,
      gelatoOrderId: gelatoOrder.id,
      status:        gelatoOrder.fulfillmentStatus,
    });

  } catch (err) {
    console.error("Fulfill print order error:", err.message);

    if (process.env.RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method:  "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          from:    "My Tiny Tales <hello@mytinytales.studio>",
          to:      ["hello@mytinytales.studio"],
          subject: `⚠️ Print order failed — ${body?.sessionId || "unknown session"}`,
          html:    `<p><strong>Error:</strong> ${err.message}</p><p><strong>Session:</strong> ${body?.sessionId}</p><p>Check Vercel logs for full stack trace.</p>`,
        }),
      }).catch(e => console.error("Admin alert email failed:", e.message));
    }

    return Response.json({ error: err.message }, { status: 500 });
  }
}
