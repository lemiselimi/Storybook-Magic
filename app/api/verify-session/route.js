import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) return Response.json({ error: "Missing session_id" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return Response.json({ error: "Payment not completed" }, { status: 402 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Verify session error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
