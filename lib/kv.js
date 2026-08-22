import { createClient } from "@vercel/kv";

// Shared KV client built from TRIMMED credentials.
//
// Values pasted into the Vercel dashboard sometimes carry a trailing newline or
// space (CRON_SECRET did). A malformed REST URL or token makes every KV call
// fail with an opaque "fetch failed", which surfaces to users as a broken
// checkout. Trimming here makes all database access resilient to that.
export const kv = createClient({
  url:   (process.env.KV_REST_API_URL   || "").trim(),
  token: (process.env.KV_REST_API_TOKEN || "").trim(),
});
