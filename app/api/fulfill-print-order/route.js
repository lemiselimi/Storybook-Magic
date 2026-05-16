import Stripe from "stripe";
import { kv } from "@vercel/kv";

export const maxDuration = 60;

// Lulu production API
const LULU_TOKEN_URL = "https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token";
const LULU_JOBS_URL  = "https://api.lulu.com/print-jobs/";

// 11×8.5" landscape, full color, standard softcover (perfect bound)
// Set LULU_PACKAGE_ID env var to override (e.g. for saddle-stitch or different size)
// Look up valid IDs at: https://developers.lulu.com/api-reference/#get-all-print-job-specifications
const DEFAULT_PACKAGE = "1100X0850FCSTDPB060UW444MXX";

async function getLuluToken() {
  const params = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     process.env.LULU_CLIENT_ID,
    client_secret: process.env.LULU_CLIENT_SECRET,
  });
  const res = await fetch(LULU_TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu auth failed: ${res.status} — ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function createLuluJob(token, { coverPdfUrl, interiorPdfUrl, shippingAddress, contactEmail, title, externalId }) {
  const body = {
    contact_email: contactEmail,
    external_id:   externalId,
    line_items: [{
      title,
      cover:    { source_url: coverPdfUrl },
      interior: { source_url: interiorPdfUrl },
      pod_package_id: process.env.LULU_PACKAGE_ID || DEFAULT_PACKAGE,
      quantity: 1,
    }],
    shipping_address: shippingAddress,
    shipping_level:   "MAIL",
    production_delay: 120,
  };

  const res = await fetch(LULU_JOBS_URL, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lulu print job failed: ${res.status} — ${text}`);
  }
  return res.json();
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }
  if (!process.env.LULU_CLIENT_ID || !process.env.LULU_CLIENT_SECRET) {
    return Response.json({ error: "Lulu credentials not configured" }, { status: 503 });
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
    // ── 1. Verify payment & get shipping address from Stripe ─────────────────
    // shipping_details is auto-populated for sessions with shipping_address_collection —
    // it is NOT an expandable property and must not be passed to expand[]
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return Response.json({ error: "Payment not completed" }, { status: 402 });
    }

    // shipping_details is the primary source; customer_details.address is the fallback
    const shipping = session.shipping_details ?? null;
    const address  = shipping?.address ?? session.customer_details?.address ?? null;

    if (!address) {
      return Response.json({ error: "No shipping address on Stripe session — make sure shipping_address_collection is enabled for print orders" }, { status: 400 });
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
      email:        contactEmail,
      phone_number: session.customer_details?.phone || "",
    };

    // ── 2. Generate print-ready PDFs ─────────────────────────────────────────
    const origin = request.headers.get("origin") ||
                   (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio");

    const pdfRes = await fetch(`${origin}/api/generate-book-pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverFalUrl, pageFalUrls, story, childName, theme }),
    });

    if (!pdfRes.ok) {
      const err = await pdfRes.json().catch(() => ({}));
      throw new Error(`PDF generation failed: ${err.error || pdfRes.status}`);
    }

    const { coverPdfUrl, interiorPdfUrl } = await pdfRes.json();

    // ── 3. Submit print job to Lulu ─────────────────────────────────────────
    const token = await getLuluToken();

    const capName = childName
      ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
      : "a special child";

    const luluJob = await createLuluJob(token, {
      coverPdfUrl,
      interiorPdfUrl,
      shippingAddress,
      contactEmail,
      title:      `My Tiny Tales — ${capName}'s Story`,
      externalId: sessionId,
    });

    console.log("Lulu print job created:", luluJob.id, "status:", luluJob.status);

    // Update KV order record with Lulu job ID
    try {
      const existing = await kv.get(`order:${sessionId}`) || {};
      await kv.set(`order:${sessionId}`, { ...existing, status: "fulfilled", luluJobId: luluJob.id, fulfilledAt: new Date().toISOString() }, { ex: 2_592_000 });
    } catch (kvErr) {
      console.error("KV update failed (non-fatal):", kvErr.message);
    }

    return Response.json({
      ok:         true,
      luluJobId:  luluJob.id,
      status:     luluJob.status,
      eta:        luluJob.date_created,
    });

  } catch (err) {
    console.error("Fulfill print order error:", err.message);

    // Alert admin on any failure
    if (process.env.RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
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
