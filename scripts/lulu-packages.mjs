/**
 * Validates Lulu auth and checks our package ID.
 * Run: node scripts/lulu-packages.mjs
 *
 * Make sure LULU_CLIENT_ID and LULU_CLIENT_SECRET are in your .env.local
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
} catch {
  console.error("Could not read .env.local — make sure it exists");
  process.exit(1);
}

const CLIENT_ID     = process.env.LULU_CLIENT_ID;
const CLIENT_SECRET = process.env.LULU_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("LULU_CLIENT_ID or LULU_CLIENT_SECRET not set in .env.local");
  process.exit(1);
}

// ── 1. Get token ─────────────────────────────────────────────────────────────
console.log("Authenticating with Lulu...");
const tokenRes = await fetch(
  "https://api.lulu.com/auth/realms/glasstree/protocol/openid-connect/token",
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  }
);

if (!tokenRes.ok) {
  console.error("Auth failed:", tokenRes.status, await tokenRes.text());
  process.exit(1);
}

const { access_token } = await tokenRes.json();
console.log("Authenticated ✓\n");

const headers = { Authorization: `Bearer ${access_token}` };

// ── 2. Probe endpoints to find what's available ───────────────────────────────
const ENDPOINTS = [
  "https://api.lulu.com/print-job-specifications/?page_size=5",
  "https://api.lulu.com/print-job-specifications/?pod_package_id=1100X0850FCSTDPB060UW444MXX",
  "https://api.lulu.com/pod-packages/?page_size=5",
  "https://api.lulu.com/v1/print-job-specifications/?page_size=5",
  "https://api.lulu.com/print-jobs/",
];

console.log("Probing Lulu API endpoints...\n");
for (const url of ENDPOINTS) {
  const res = await fetch(url, { headers });
  const body = await res.text();
  console.log(`${res.status}  ${url}`);
  if (res.ok) {
    try {
      const json = JSON.parse(body);
      console.log("     →", JSON.stringify(json).substring(0, 200));
    } catch {
      console.log("     →", body.substring(0, 200));
    }
  }
}

console.log("\nDone. Auth is working — check which endpoints returned 200 above.");
