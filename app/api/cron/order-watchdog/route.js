import { isWatchdogCron, privateHeaders } from "@/lib/watchdog-auth";
import { runWatchdog } from "@/lib/order-watchdog";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export async function GET(request) {
  if (!isWatchdogCron(request)) return new Response("Unauthorized", { status: 401, headers: privateHeaders });
  try { return Response.json(await runWatchdog(), { headers: privateHeaders }); }
  catch { return Response.json({ error: "Monitoring failed" }, { status: 503, headers: privateHeaders }); }
}
