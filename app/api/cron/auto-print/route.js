import { kv } from "@vercel/kv";
import { submitPrintFromKV, sendPrintFailureAlert } from "@/lib/gelato";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// Daily Vercel cron: auto-submits print orders the customer hasn't approved
// within 3 days of the book becoming ready (see vercel.json).
export async function GET(request) {
  if (process.env.CRON_SECRET && request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const refs = (await kv.smembers("pending-prints").catch(() => null)) || [];
  const out = { checked: refs.length, submitted: 0, waiting: 0, cleaned: 0, failed: 0 };

  for (const ref of refs) {
    try {
      const result = await kv.get(`result:${ref}`);

      // Stale entries: book gone, not a print order, or already submitted
      if (!result || result.plan !== "print" || result.printApproval === "submitted") {
        await kv.srem("pending-prints", ref).catch(() => {});
        out.cleaned++;
        continue;
      }

      const readyAt = result.printReadyAt ? Date.parse(result.printReadyAt) : NaN;
      if (!Number.isFinite(readyAt) || Date.now() - readyAt < THREE_DAYS_MS) {
        out.waiting++;
        continue;
      }

      const { gelatoOrderId } = await submitPrintFromKV(ref);
      console.log("auto-print: submitted ref", ref, "order", gelatoOrderId);
      out.submitted++;

    } catch (err) {
      console.error("auto-print: failed for ref", ref, "—", err.message);
      sendPrintFailureAlert({ ref, sessionId: null, error: err.message, context: "3-day auto-send" });
      out.failed++;
    }
  }

  console.log("auto-print run:", JSON.stringify(out));
  return Response.json(out);
}
