import { isWatchdogAdmin, privateHeaders } from "@/lib/watchdog-auth";
import { watchdogSnapshot, runWatchdog } from "@/lib/order-watchdog";
import { POST as retryGeneration } from "@/app/api/retry-generation/route";
import { kv } from "@/lib/kv";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isWatchdogAdmin(request)) return new Response("Unauthorized", { status: 401, headers: privateHeaders });
  try { return Response.json(await watchdogSnapshot(), { headers: privateHeaders }); }
  catch { return Response.json({ error: "Order dashboard unavailable" }, { status: 503, headers: privateHeaders }); }
}
export async function POST(request) {
  if (!isWatchdogAdmin(request)) return new Response("Unauthorized", { status: 401, headers: privateHeaders });
  const body = await request.json().catch(() => null);
  try {
    if (body?.action === "check") return Response.json(await runWatchdog(), { headers: privateHeaders });
    if (body?.action !== "retry" || typeof body.ref !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(body.ref)) return Response.json({ error: "Invalid action" }, { status: 400, headers: privateHeaders });
    const result = await kv.get(`result:${body.ref}`);
    if (!result?.accessToken) return Response.json({ error: "This order needs manual investigation" }, { status: 409, headers: privateHeaders });
    // Reuse the existing authorized, locked, bounded recovery path. Never submit print or charge a card.
    const response = await retryGeneration(new Request(new URL("/api/retry-generation", request.url), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: body.ref, accessToken: result.accessToken }),
    }));
    await kv.set(`watchdog:recovery:${body.ref}`, { at: new Date().toISOString(), ok: response.ok, action: "Operator retried unfinished illustrations" }, { ex: 30 * 86_400 });
    return Response.json(await response.json(), { status: response.status, headers: privateHeaders });
  } catch { return Response.json({ error: "Action could not finish. Refresh the dashboard before retrying." }, { status: 503, headers: privateHeaders }); }
}
