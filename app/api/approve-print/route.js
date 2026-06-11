import { kv } from "@vercel/kv";
import { submitPrintFromKV, sendPrintFailureAlert } from "@/lib/gelato";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Customer presses "Approve & Send to Print" on /book/[ref].
// Possession of the ref is the same capability already required to view the
// book; submission only ships to the address on the paid Stripe session, and
// submitPrintFromKV is idempotent so repeat calls can't double-order.
export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const ref = body?.ref;
  if (!ref) return Response.json({ error: "ref required" }, { status: 400 });

  let sessionId = null;
  try {
    const result = await kv.get(`result:${ref}`);
    if (!result) return Response.json({ error: "Book not found" }, { status: 404 });
    sessionId = result.sessionId ?? null;

    const { gelatoOrderId, alreadyFulfilled } = await submitPrintFromKV(ref);
    console.log("approve-print: ref", ref, "order", gelatoOrderId, alreadyFulfilled ? "(already fulfilled)" : "");
    return Response.json({ ok: true });

  } catch (err) {
    console.error("approve-print error:", err.message);
    sendPrintFailureAlert({ ref, sessionId, error: err.message, context: "customer approval" });
    return Response.json({
      error: "We couldn't submit your print order just now. Our team has been notified and will sort it out — no action needed.",
    }, { status: 500 });
  }
}
