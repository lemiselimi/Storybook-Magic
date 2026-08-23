import Stripe from "stripe";
import { kv } from "@/lib/kv";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request) {
  const sig    = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  let event;
  try {
    const rawBody = await request.text();
    const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status !== "paid") return new Response("ok");

    const ref  = session.metadata?.ref;
    const plan = session.metadata?.plan;
    if (!ref) return new Response("ok");

    const contactEmail  = session.customer_details?.email || "";
    const customerName  = session.shipping_details?.name || session.customer_details?.name || "";

    // Record the paid order in KV
    await kv.set(`order:${session.id}`, {
      ref, plan, status: "paid", contactEmail, customerName,
      sessionId: session.id, paidAt: new Date().toISOString(),
    }, { ex: 2_592_000 }).catch(e => console.error("KV order write failed:", e.message));

    console.log("Webhook: payment confirmed, ref:", ref, "plan:", plan);

    // Kick off background book generation
    try {
      const bookData = await kv.get(`book:${ref}`);
      if (!bookData) throw new Error(`Book data not found for ref ${ref}`);

      const { referenceUrl, coverPrompt, scenePrompts, seed, story, childName, previewImages } = bookData;
      if (!referenceUrl)  throw new Error("No reference image in book data — photo upload may have failed");
      if (!coverPrompt || !scenePrompts?.length) throw new Error("No precomputed prompts in book data");

      const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";
      const webhookUrl = `${siteUrl}/api/fal-webhook`;

      // All image slots: "cover" + 0..5 for the 6 story pages.
      const allJobs = [
        { slot: "cover", prompt: coverPrompt },
        ...scenePrompts.map((p, i) => ({ slot: i, prompt: p })),
      ];

      // Reuse the cover + free preview pages already generated for the preview,
      // so we only generate the pages the customer hasn't seen yet.
      const preset = {};
      if (previewImages?.cover) preset.cover = previewImages.cover;
      for (let i = 0; i < scenePrompts.length; i++) {
        if (previewImages?.[i]) preset[i] = previewImages[i];
      }
      // Guard: never end up with zero jobs (would leave the book stuck), so if
      // somehow everything is preset, regenerate the cover.
      let jobs = allJobs.filter(j => preset[j.slot] === undefined);
      if (jobs.length === 0) { delete preset.cover; jobs = [{ slot: "cover", prompt: coverPrompt }]; }

      // Init result record. `images` is pre-filled with reused preview images;
      // `totalJobs` is the TOTAL image count (reused + new) so fal-webhook knows
      // when the whole set of 7 is complete.
      await kv.set(`result:${ref}`, {
        status:        "generating",
        sessionId:     session.id,
        plan,
        childName,
        story,
        contactEmail,
        customerName,
        images:        preset,
        totalJobs:     allJobs.length,
        createdAt:     new Date().toISOString(),
        completedAt:   null,
        coverPdfUrl:   null,
        interiorPdfUrl: null,
      }, { ex: 2_592_000 });

      // Submit all image generation jobs to fal with webhook callback
      for (const { slot, prompt } of jobs) {
        const res = await fetch(`${siteUrl}/api/generate-scene`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ referenceImageUrl: referenceUrl, prompt, seed, webhookUrl }),
        }).then(r => r.json());

        if (!res.jobId) {
          console.error(`Scene submit failed for slot ${slot}:`, res.error);
          continue;
        }

        // Store reverse lookup so fal-webhook knows which order/slot completed
        await kv.set(`job:${res.jobId}`, { ref, slot }, { ex: 14_400 }); // 4h TTL
        console.log(`Job submitted: slot=${slot} jobId=${res.jobId}`);
      }

      console.log("Webhook: all jobs submitted for ref", ref);

    } catch (err) {
      console.error("Webhook: background generation failed to start:", err.message);

      // Persist a failed status so the customer sees the "something went wrong"
      // screen instead of an endless blank spinner, and so the failure is
      // queryable via book-status rather than only via the admin email.
      await kv.set(`result:${ref}`, {
        status:    "failed",
        plan,
        error:     err.message,
        createdAt: new Date().toISOString(),
      }, { ex: 2_592_000 }).catch(() => {});

      // Alert admin
      if (process.env.RESEND_API_KEY) {
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from:    "My Tiny Tales <hello@mytinytales.studio>",
            to:      ["hello@mytinytales.studio"],
            subject: `⚠️ Book generation failed to start — ref: ${ref}`,
            html:    `<p><strong>Error:</strong> ${err.message}</p><p><strong>Session:</strong> ${session.id}</p><p><strong>Ref:</strong> ${ref}</p>`,
          }),
        }).catch(() => {});
      }
    }
  }

  return new Response("ok");
}
