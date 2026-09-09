import { kv } from "@/lib/kv";
import { submitPrintFromKV, sendPrintFailureAlert } from "@/lib/print";
import { hasAccessToken } from "@/lib/security";
import Stripe from "stripe";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

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

// Customer presses "Approve & Send to Print" on /book/[ref].
// Possession of the ref is the same capability already required to view the
// book; submission only ships to the address on the paid Stripe session, and
// submitPrintFromKV is idempotent so repeat calls can't double-order.
export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const ref = body?.ref;
  if (!ref || (!body?.accessToken && !body?.sessionId)) return Response.json({ error: "Book access token required" }, { status: 401 });

  let sessionId = null;
  try {
    const result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ error: "Book not found" }, { status: 404 });
    const authorized = hasAccessToken(body.accessToken, result.accessToken)
      || await hasPurchasedSession(body.sessionId, ref, result);
    if (!authorized) return Response.json({ error: "Unauthorized" }, { status: 403 });
    sessionId = result.sessionId ?? null;

    const { orderId, alreadyFulfilled } = await submitPrintFromKV(ref);
    console.log("approve-print: ref", ref, "order", orderId, alreadyFulfilled ? "(already fulfilled)" : "");
    return Response.json({ ok: true });

  } catch (err) {
    console.error("approve-print error:", err.message);
    sendPrintFailureAlert({ ref, sessionId, error: err.message, context: "customer approval" });
    return Response.json({
      error: "We couldn't submit your print order just now. Our team has been notified and will sort it out — no action needed.",
    }, { status: 500 });
  }
}
