import Stripe from "stripe";
import { kv } from "@/lib/kv";
import { hasAccessToken, rateLimit } from "@/lib/security";

const PRICE_DIGITAL = process.env.STRIPE_PRICE_DIGITAL;
const PRICE_PRINT   = process.env.STRIPE_PRICE_PRINT;

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !PRICE_DIGITAL || !PRICE_PRINT) {
    return Response.json({ error: "Payments not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const limit = await rateLimit(request, "checkout", 10, 60 * 60);
    if (!limit.allowed) return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const { ref, plan, accessToken } = await request.json();
    const bookData = await kv.get(`book:${ref}`);
    if (!bookData || !hasAccessToken(accessToken, bookData.accessToken) || bookData.plan !== plan) {
      return Response.json({ error: "Book session is no longer available. Please create a new preview." }, { status: 403 });
    }
    const ALLOWED_ORIGINS = new Set(["https://mytinytales.studio", "http://localhost:3000"]);
    const rawOrigin = request.headers.get("origin") || "";
    const origin = ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : "https://mytinytales.studio";

    const priceId = plan === "print" ? PRICE_PRINT : PRICE_DIGITAL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      allow_promotion_codes: true,
      metadata: { ref, plan },
      success_url: `${origin}/book/${ref}?session_id={CHECKOUT_SESSION_ID}&access_token=${encodeURIComponent(accessToken)}`,
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

