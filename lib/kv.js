import { createClient } from "@vercel/kv";

// Shared KV client, built from TRIMMED credentials.
//
// Vercel marketplace storage prefixes its env vars with the store name
// (e.g. MYTINYTALES_ORDERS_KV_REST_API_URL), so we check the prefixed names
// first and fall back to the plain KV_REST_API_* names. Trimming guards against
// a stray newline/space in a pasted value (which shows up as "fetch failed").
export const KV_REST_URL =
  (process.env.MYTINYTALES_ORDERS_KV_REST_API_URL || process.env.KV_REST_API_URL || "").trim();
const KV_REST_TOKEN =
  (process.env.MYTINYTALES_ORDERS_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || "").trim();

export const kv = createClient({ url: KV_REST_URL, token: KV_REST_TOKEN });
