import crypto from "crypto";
import { kv } from "@/lib/kv";

// Kept separate when configured. The Stripe webhook secret is a safe fallback
// for existing deployments until INTERNAL_API_SECRET is added in Vercel.
const internalSecret = process.env.INTERNAL_API_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";

function equal(left, right) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function newAccessToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hasAccessToken(value, expected) {
  return equal(value, expected);
}

export function isInternalRequest(request) {
  const authorization = request.headers.get("authorization") || "";
  return equal(authorization.replace(/^Bearer\s+/i, ""), internalSecret);
}

export function internalAuthorization() {
  if (!internalSecret) throw new Error("INTERNAL_API_SECRET or STRIPE_WEBHOOK_SECRET must be configured");
  return `Bearer ${internalSecret}`;
}

export function internalWebhookUrl(siteUrl) {
  if (!internalSecret) throw new Error("INTERNAL_API_SECRET or STRIPE_WEBHOOK_SECRET must be configured");
  return `${siteUrl}/api/fal-webhook?token=${encodeURIComponent(internalSecret)}`;
}

export function isInternalWebhook(request) {
  return equal(new URL(request.url).searchParams.get("token") || "", internalSecret);
}

function clientIp(request) {
  // Vercel supplies this header; avoid trusting arbitrary client x-forwarded-for
  // values when it is absent.
  return request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
}

export async function rateLimit(request, scope, limit, windowSeconds) {
  const digest = crypto.createHash("sha256").update(clientIp(request)).digest("hex");
  const key = `rate:${scope}:${digest}`;
  try {
    const count = await kv.incr(key);
    if (count === 1) await kv.expire(key, windowSeconds);
    return { allowed: count <= limit, retryAfter: windowSeconds };
  } catch (error) {
    // Do not silently leave paid AI endpoints unprotected when KV is unavailable.
    console.error("Rate limit unavailable:", error.message);
    return { allowed: false, retryAfter: windowSeconds };
  }
}

export function isAllowedFalAsset(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ["v3b.fal.media", "fal.media", "cdn.fal.ai", "fal-cdn.anthropic.com"].some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

