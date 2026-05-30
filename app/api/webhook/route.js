import Stripe from "stripe";
import { kv } from "@vercel/kv";

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

      const { loraUrl, coverPrompt, scenePrompts, seed, story, childName } = bookData;
      if (!loraUrl)       throw new Error("No loraUrl in book data — training may not have completed");
      if (!coverPrompt || !scenePrompts?.length) throw new Error("No precomputed prompts in book data");

      const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mytinytales.studio";
      const webhookUrl = `${siteUrl}/api/fal-webhook`;

      // Slots: "cover" + 0..5 for the 6 story pages
      const jobs = [
        { slot: "cover", prompt: coverPrompt },
        ...scenePrompts.map((p, i) => ({ slot: i, prompt: p })),
      ];

      // Init result record before submitting jobs (fal can be very fast)
      await kv.set(`result:${ref}`, {
        status:        "generating",
        sessionId:     session.id,
        plan,
        childName,
        story,
        contactEmail,
        customerName,
        images:        {},
        totalJobs:     jobs.length,
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
          body:    JSON.stringify({ loraUrl, prompt, seed, webhookUrl }),
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

      // Email customer — "your book is being illustrated"
      if (process.env.RESEND_API_KEY && contactEmail) {
        const firstName = customerName.split(" ")[0] || "there";
        fetch("https://api.resend.com/emails", {
          method:  "POST",
          headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from:    "My Tiny Tales <hello@mytinytales.studio>",
            to:      [contactEmail],
            subject: `🎨 We're illustrating your storybook now, ${firstName}!`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#1a0a2e,#2d1b4e);padding:32px;text-align:center;">
                  <div style="font-size:40px;margin-bottom:8px;">🎨</div>
                  <h1 style="color:white;font-size:22px;margin:0;">Your storybook is being illustrated!</h1>
                </div>
                <div style="padding:32px;">
                  <p style="color:#3d2b1f;font-size:15px;line-height:1.7;">Hi ${firstName}! We've received your order and our AI illustrators are painting your personalised storybook right now.</p>
                  <p style="color:#3d2b1f;font-size:15px;line-height:1.7;">We'll email you a link to your finished book in <strong>5–10 minutes</strong>. You can close this tab — we'll take it from here.</p>
                  <p style="color:#8a6d5a;font-size:13px;">Questions? Reply to this email or reach us at <a href="mailto:hello@mytinytales.studio">hello@mytinytales.studio</a>.</p>
                </div>
                <div style="background:#1a0a2e;padding:20px;text-align:center;">
                  <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">© ${new Date().getFullYear()} My Tiny Tales</p>
                </div>
              </div>
            `,
          }),
        }).catch(e => console.error("Prep email failed:", e.message));
      }

    } catch (err) {
      console.error("Webhook: background generation failed to start:", err.message);
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
