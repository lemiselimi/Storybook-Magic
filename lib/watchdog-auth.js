import { timingSafeEqual } from "node:crypto";

function matches(value, expected) {
  if (!expected || expected.length < 32 || !value) return false;
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function isWatchdogAdmin(request) {
  return matches(request.headers.get("authorization")?.replace(/^Bearer /, ""), process.env.WATCHDOG_ADMIN_KEY);
}
export function isWatchdogCron(request) {
  const expected = process.env.CRON_SECRET;
  const actual = request.headers.get("authorization");
  if (!expected || !actual) return false;
  const a = Buffer.from(actual), b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const privateHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
