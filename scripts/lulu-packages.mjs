/**
 * Lists valid Lulu print package IDs.
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
  "https://api.lulu.com/auth/realms/lulu/protocol/openid-connect/token",
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

// ── 2. Fetch print job specifications ────────────────────────────────────────
console.log("Fetching print specifications...\n");
const specsRes = await fetch(
  "https://api.lulu.com/print-job-specifications/",
  { headers: { Authorization: `Bearer ${access_token}` } }
);

if (!specsRes.ok) {
  console.error("Failed to fetch specs:", specsRes.status, await specsRes.text());
  process.exit(1);
}

const specs = await specsRes.json();
const items = specs.results ?? specs;

// ── 3. Filter and display ────────────────────────────────────────────────────
// Show full-color packages likely suitable for a children's picture book
const COLOR_TYPES  = ["FC"];          // full color only
const BIND_TYPES   = ["STDSB", "STSB", "SADSS", "SS"]; // softcovers

console.log("=".repeat(72));
console.log("FULL-COLOR PACKAGES (sorted by size)");
console.log("=".repeat(72));

const relevant = items.filter(s => {
  const id = s.id ?? s.pod_package_id ?? "";
  return COLOR_TYPES.some(c => id.includes(c));
});

// Group by approximate size
relevant.sort((a, b) => {
  const aId = a.id ?? a.pod_package_id ?? "";
  const bId = b.id ?? b.pod_package_id ?? "";
  return aId.localeCompare(bId);
});

for (const spec of relevant) {
  const id   = spec.id ?? spec.pod_package_id ?? "unknown";
  const desc = spec.description ?? spec.name ?? "";
  const w    = spec.interior?.width_mm  ?? spec.width_mm  ?? "";
  const h    = spec.interior?.height_mm ?? spec.height_mm ?? "";
  const dim  = w && h ? `  ${w}×${h}mm` : "";
  console.log(`  ${id.padEnd(36)}${dim.padEnd(18)}${desc}`);
}

console.log("\n" + "=".repeat(72));
console.log(`Total full-color packages found: ${relevant.length}`);
console.log("=".repeat(72));

// ── 4. Check our current default ─────────────────────────────────────────────
const CURRENT = "1100X0850FCSTDPB060UW444MXX";
const match   = items.find(s => (s.id ?? s.pod_package_id) === CURRENT);
console.log(`\nCurrent default (${CURRENT}):`);
console.log(match ? `  VALID ✓ — ${match.description ?? match.name ?? ""}` : "  NOT FOUND ✗ — needs updating");

if (!match) {
  console.log("\nRecommended alternatives for an 11×8.5\" landscape children's book:");
  const landscape = relevant.filter(s => {
    const id = s.id ?? s.pod_package_id ?? "";
    return id.startsWith("1100X0850") || id.startsWith("1100X085");
  });
  if (landscape.length) {
    landscape.forEach(s => console.log(`  ${s.id ?? s.pod_package_id}`));
  } else {
    console.log("  No 11×8.5\" packages found — check the full list above");
  }
}

console.log("\nTo use a different package, add to Vercel env vars:");
console.log("  LULU_PACKAGE_ID=<the_id_from_above>\n");
