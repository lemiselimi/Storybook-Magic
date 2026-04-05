import Stripe from "stripe";

const PRICE = Number(process.env.BOOK_PRICE_CENTS || 499); // $4.99 default

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Payments not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const { ref } = await request.json();
    const origin = request.headers.get("origin") || "https://storybookapp-vercel.app";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "StoryBook Magic — Personalised Storybook",
            description: "A unique Pixar-style illustrated book starring your child",
            images: ["https://storybookapp-vercel.app/og-image.png"],
          },
          unit_amount: PRICE,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/?success=1&session_id={CHECKOUT_SESSION_ID}&ref=${ref}`,
      cancel_url: `${origin}/?cancelled=1`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
