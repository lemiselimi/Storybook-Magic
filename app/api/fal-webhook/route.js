import Stripe from "stripe";
import { kv } from "@vercel/kv";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const GELATO_API_URL = "https://order.gelatoapis.com/v4/orders";

export async function POST(request) {
  let payload;
  try { payload = await request.json(); }
  catch { return new Response("ok"); }

  const jobId = payload.request_id;
  if (!jobId) return new Response("ok");

  // Look up which order/slot this job belongs to
  const jobInfo = await kv.get(`job:${jobId}`);
  if (!jobInfo) {
    console.warn("fal-webhook: unknown job", jobId);
    return new Response("ok");
  }

  const { ref, slot } = jobInfo;
  const imageUrl = payload.payload?.images?.[0]?.url ?? null;

  if (payload.status !== "OK" || !imageUrl) {
    console.error(`fal-webhook: job ${jobId} failed (ref=${ref} slot=${slot})`);
    return new Response("ok");
  }

  // Read current result, update image slot
  const result = await kv.get(`result:${ref}`);
  if (!result || result.status === "ready" || result.status === "pdf_generating") {
    return new Response("ok"); // already processed
  }

  const updatedImages = { ...result.images, [slot]: imageUrl };
  const completedCount = Object.values(updatedImages).filter(Boolean).length;
  const allDone = completedCount >= result.totalJobs;

  await kv.set(`result:${ref}`, {
    ...result,
    images:  updatedImages,
    status:  allDone ? "pdf_generating" : "generating",
  }, { ex: 2_592_000 });

  console.log(`fal-webhook: ref=${ref} slot=${slot} (${completedCount}/${result.totalJobs})`);

  if (!allDone) return new Response("ok");

  // All images ready — generate PDFs, email customer, submit print if needed
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";

  try {
    const pageUrls = [0, 1, 2, 3, 4, 5].map(i => updatedImages[i] ?? null);

    // Generate print-ready PDFs
    const pdfRes = await fetch(`${siteUrl}/api/generate-book-pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        coverFalUrl:  updatedImages["cover"],
        pageFalUrls:  pageUrls,
        story:        result.story,
        childName:    result.childName,
      }),
    });

    if (!pdfRes.ok) {
      const err = await pdfRes.json().catch(() => ({}));
      throw new Error(`PDF generation failed: ${err.error || pdfRes.status}`);
    }

    const { coverPdfUrl, interiorPdfUrl } = await pdfRes.json();

    // Mark book as ready
    await kv.set(`result:${ref}`, {
      ...result,
      images:         updatedImages,
      status:         "ready",
      coverPdfUrl,
      interiorPdfUrl,
      completedAt:    new Date().toISOString(),
    }, { ex: 2_592_000 });

    console.log("fal-webhook: book ready for ref", ref);

    // Submit print order to Gelato if needed
    if (result.plan === "print" && result.sessionId) {
      try {
        const gelatoKey = process.env.GELATO_API_KEY;
        if (!gelatoKey || !process.env.GELATO_PRODUCT_UID) throw new Error("Gelato not configured");

        const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(result.sessionId);
        const shipping = session.shipping_details ?? null;
        const address  = shipping?.address ?? session.customer_details?.address ?? null;
        if (!address) throw new Error("No shipping address on Stripe session");

        const nameParts = (shipping?.name || session.customer_details?.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "Guest";
        const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;

        const gelatoBody = {
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
        };

        const gelatoRes = await fetch(GELATO_API_URL, {
          method:  "POST",
          headers: { "X-API-KEY": gelatoKey, "Content-Type": "application/json" },
          body:    JSON.stringify(gelatoBody),
        });

        if (!gelatoRes.ok) {
          const text = await gelatoRes.text();
          throw new Error(`Gelato order failed: ${gelatoRes.status} — ${text}`);
        }

        const gelatoOrder = await gelatoRes.json();
        console.log("fal-webhook: Gelato order created:", gelatoOrder.id);

        // Update KV with Gelato order ID
        await kv.set(`order:${result.sessionId}`, {
          ref, plan: "print", status: "fulfilled",
          gelatoOrderId: gelatoOrder.id,
          fulfilledAt: new Date().toISOString(),
        }, { ex: 2_592_000 }).catch(() => {});

      } catch (printErr) {
        console.error("fal-webhook: Gelato submission failed:", printErr.message);
        if (process.env.RESEND_API_KEY) {
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from:    "My Tiny Tales <hello@mytinytales.studio>",
              to:      ["hello@mytinytales.studio"],
              subject: `⚠️ Print submission failed — ref: ${ref}`,
              html:    `<p><strong>Error:</strong> ${printErr.message}</p><p><strong>Ref:</strong> ${ref}</p><p><strong>Session:</strong> ${result.sessionId}</p>`,
            }),
          }).catch(() => {});
        }
      }
    }

  } catch (err) {
    console.error("fal-webhook: post-completion error:", err.message);
    await kv.set(`result:${ref}`, {
      ...result,
      images:  updatedImages,
      status:  "failed",
      error:   err.message,
    }, { ex: 2_592_000 }).catch(() => {});

    if (process.env.RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from:    "My Tiny Tales <hello@mytinytales.studio>",
          to:      ["hello@mytinytales.studio"],
          subject: `⚠️ Book completion failed — ref: ${ref}`,
          html:    `<p><strong>Error:</strong> ${err.message}</p><p><strong>Ref:</strong> ${ref}</p>`,
        }),
      }).catch(() => {});
    }
  }

  return new Response("ok");
}
