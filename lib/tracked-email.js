import { Resend } from "resend";
import { kv } from "@/lib/kv";

const TTL = 30 * 86_400;
// Track existing transactional sends without retaining email bodies or customer addresses.
export async function sendTrackedEmail(message, purpose) {
  const attempt = crypto.randomUUID();
  let accepted;
  try {
    if (!process.env.RESEND_API_KEY) throw new Error("Email service is not configured");
    const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send(message);
    if (error || !data?.id) throw new Error("Email provider did not accept the message");
    accepted = data;
  } catch (error) {
    await kv.set(`watchdog:mail-meta:${attempt}`, { purpose, sentAt: new Date().toISOString(), sendFailed: true }, { ex: TTL }).catch(() => {});
    await kv.zadd("watchdog:mail", { score: Date.now(), member: attempt }).catch(() => {});
    throw error;
  }
  // A tracking outage must not misreport an accepted send as failed and encourage duplicate sends.
  try {
    await kv.set(`watchdog:mail-meta:${accepted.id}`, { purpose, sentAt: new Date().toISOString() }, { ex: TTL });
    await kv.zadd("watchdog:mail", { score: Date.now(), member: accepted.id });
  } catch { console.error("Email accepted but operational tracking failed"); }
  return accepted;
}
