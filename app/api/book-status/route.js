import { kv } from "@/lib/kv";
import { hasAccessToken } from "@/lib/security";
import Stripe from "stripe";

async function hasPurchasedSession(sessionId, ref, result) {
  if (!sessionId || sessionId !== result.sessionId || !process.env.STRIPE_SECRET_KEY) return false;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid" && session.metadata?.ref === ref;
  } catch {
    return false;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const accessToken = searchParams.get("access_token");
  const sessionId = searchParams.get("session_id");
  if (!ref || (!accessToken && !sessionId)) return Response.json({ error: "Book access token required" }, { status: 401 });

  try {
    const result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ status: "not_found" }, { status: 404 });
    const authorized = hasAccessToken(accessToken, result.accessToken)
      || await hasPurchasedSession(sessionId, ref, result);
    if (!authorized) return Response.json({ error: "Unauthorized" }, { status: 403 });

    // Proxy image URLs through /api/proxy so CORS + caching work correctly
    const proxied = (url) => url ? `/api/proxy?url=${encodeURIComponent(url)}` : null;

    return Response.json({
      status:         result.status,
      childName:      result.childName,
      story:          result.story,
      plan:           result.plan,
      coverUrl:       proxied(result.images?.cover),
      pageUrls:       (result.story?.pages || []).map((_, i) => proxied(result.images?.[i])),
      interiorPdfUrl: result.interiorPdfUrl ?? null,
      completedAt:    result.completedAt ?? null,
      printApproval:  result.printApproval ?? null,
    });
  } catch (err) {
    console.error("book-status error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
