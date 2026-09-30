import { Resend } from "resend";
import { kv } from "@/lib/kv";

export async function POST(request) {
  if (!process.env.RESEND_WEBHOOK_SECRET || !process.env.RESEND_API_KEY) return new Response("Not configured", { status: 503 });
  let event;
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload: await request.text(), webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
      headers: { id: request.headers.get("svix-id"), timestamp: request.headers.get("svix-timestamp"), signature: request.headers.get("svix-signature") },
    });
  } catch { return new Response("Invalid signature", { status: 400 }); }
  const accepted = ["email.sent", "email.delivered", "email.bounced", "email.complained", "email.failed", "email.suppressed", "email.delivery_delayed"];
  if (!accepted.includes(event.type) || !event.data?.email_id) return new Response("ok");
  const id = event.data.email_id;
  const at = Date.parse(event.created_at);
  if (!Number.isFinite(at)) return new Response("Invalid event time", { status: 400 });
  try {
    // Duplicate and out-of-order callbacks must not turn a delivered message back into "sent".
    await kv.eval(`
      local raw = redis.call('get', KEYS[1])
      if raw then
        local old = cjson.decode(raw)
        if old.at >= tonumber(ARGV[1]) then return 0 end
      end
      redis.call('set', KEYS[1], ARGV[2], 'EX', 2592000)
      return 1
    `, [`watchdog:mail-event:${id}`], [String(at), JSON.stringify({ type: event.type, at })]);
    await kv.zadd("watchdog:mail", { score: at, member: id });
    return new Response("ok");
  } catch { return new Response("Tracking unavailable", { status: 503 }); }
}
