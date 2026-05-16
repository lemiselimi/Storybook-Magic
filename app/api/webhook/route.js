import Stripe from "stripe";
import { kv } from "@vercel/kv";

export const maxDuration = 30;

// Stripe requires the raw body for signature verification — disable Next.js body parsing
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

    if (!ref || plan !== "print") return new Response("ok");

    try {
      const shipping = session.shipping_details;
      const customerEmail = session.customer_details?.email || "";

      // Record the paid print order in KV so fulfillment can verify it
      await kv.set(`order:${session.id}`, {
        ref,
        plan,
        status:         "paid",
        customerEmail,
        sessionId:      session.id,
        shippingName:   shipping?.name || "",
        paidAt:         new Date().toISOString(),
      }, { ex: 2_592_000 }); // 30-day TTL

      console.log("Webhook: recorded print order", session.id, "ref:", ref);

      // Send confirmation email if Resend is configured
      if (process.env.RESEND_API_KEY && customerEmail) {
        const firstName = (shipping?.name || "").split(" ")[0] || "there";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    "My Tiny Tales <hello@mytinytales.studio>",
            to:      [customerEmail],
            subject: "Your storybook order is confirmed! 🎉",
            html: `
              <p>Hi ${firstName},</p>
              <p>We've received your payment and your personalised storybook is on its way!</p>
              <p>We're generating the final illustrations now. Your book will be printed and shipped within 3–5 business days.</p>
              <p>If you have any questions, just reply to this email or reach us at <a href="mailto:hello@mytinytales.studio">hello@mytinytales.studio</a>.</p>
              <p>— The My Tiny Tales team</p>
            `,
          }),
        }).catch(err => console.error("Confirmation email failed:", err.message));
      }
    } catch (err) {
      console.error("Webhook handler error:", err.message);
      // Still return 200 so Stripe doesn't retry — log and alert separately
    }
  }

  return new Response("ok");
}
