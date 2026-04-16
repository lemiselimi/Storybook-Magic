import Stripe from "stripe";

const PRICE_DIGITAL = process.env.STRIPE_PRICE_DIGITAL || "price_1TMvnV2LQoLokMlx6gqTBOke";
const PRICE_PRINT   = process.env.STRIPE_PRICE_PRINT   || "price_1TMvoB2LQoLokMlxwL0e3Ng6";

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "Payments not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const { ref, plan } = await request.json();
    const origin = request.headers.get("origin") || "https://mytinytales.studio";

    const priceId = plan === "print" ? PRICE_PRINT : PRICE_DIGITAL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/create?success=1&session_id={CHECKOUT_SESSION_ID}&ref=${ref}&plan=${plan}`,
      cancel_url: `${origin}/create?cancelled=1`,
      // Collect shipping address for print orders — Stripe shows address form at checkout
      ...(plan === "print" ? {
        shipping_address_collection: {
          allowed_countries: [
            "US","CA","GB","AU","NZ","DE","FR","NL","SE","NO","DK","FI",
            "CH","AT","BE","IE","IT","ES","PT","PL","CZ","SK","HU","RO",
            "BG","HR","SI","LT","LV","EE","GR","CY","MT","LU","IS","LI",
          ],
        },
        phone_number_collection: { enabled: true },
      } : {}),
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
