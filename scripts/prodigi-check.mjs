// Prodigi setup probe. Confirms a SKU's asset requirements, spine width, and real
// price before we finalise the integration — run once the API key is in .env.local.
//
// Usage:  node scripts/prodigi-check.mjs <SKU> [pageCount] [countryCode]
//   e.g.  node scripts/prodigi-check.mjs BOOK-200X200-SOFT 32 US
//
// Reads PRODIGI_API_KEY and PRODIGI_ENV (sandbox|live, default sandbox) from .env.local.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env  = await fs.readFile(path.join(root, ".env.local"), "utf8");
const readEnv = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] || "").trim();

const KEY = readEnv("PRODIGI_API_KEY");
if (!KEY) { console.error("PRODIGI_API_KEY missing from .env.local"); process.exit(1); }

const IS_LIVE = readEnv("PRODIGI_ENV").toLowerCase() === "live";
const BASE = IS_LIVE ? "https://api.prodigi.com/v4.0" : "https://api.sandbox.prodigi.com/v4.0";
const H = { "X-API-Key": KEY, "Content-Type": "application/json" };

const sku     = process.argv[2] || readEnv("PRODIGI_SKU");
const pages   = Number(process.argv[3] || 32);
const country = process.argv[4] || "US";
if (!sku) { console.error("Provide a SKU: node scripts/prodigi-check.mjs <SKU> [pages] [country]"); process.exit(1); }

console.log(`env: ${IS_LIVE ? "LIVE" : "sandbox"} | sku: ${sku} | pages: ${pages} | dest: ${country}\n`);

// 1. Product details — asset requirements + price + attributes
try {
  const r = await fetch(`${BASE}/products/${encodeURIComponent(sku)}`, { headers: H });
  const j = await r.json();
  console.log("=== PRODUCT DETAILS ===", r.status);
  const p = j.product || j;
  console.log("description:", p.description);
  console.log("printAreas / assets required:", JSON.stringify(p.printAreas || p.variants?.[0]?.printAreas || p.assetRequirements || "see full below"));
  console.log("attributes:", JSON.stringify(p.attributes || p.variants?.[0]?.attributes));
  console.log("full:", JSON.stringify(j).slice(0, 1500));
} catch (e) { console.log("product details error:", e.message); }

// 2. Spine width for this page count
try {
  const r = await fetch(`${BASE}/products/spine`, {
    method: "POST", headers: H,
    body: JSON.stringify({ sku, destinationCountryCode: country, numberOfPages: pages }),
  });
  console.log("\n=== SPINE ===", r.status, JSON.stringify(await r.json()));
} catch (e) { console.log("spine error:", e.message); }

// 3. Quote — real production + shipping price
for (const shippingMethod of ["Budget", "Standard", "Express"]) {
  try {
    const r = await fetch(`${BASE}/quotes`, {
      method: "POST", headers: H,
      body: JSON.stringify({
        shippingMethod, destinationCountryCode: country, currencyCode: "USD",
        items: [{ sku, copies: 1, assets: [{ printArea: "default", pageCount: pages }] }],
      }),
    });
    const j = await r.json();
    const q = j.quotes?.[0] || j.quote || j;
    console.log(`\n=== QUOTE (${shippingMethod}) ===`, r.status, JSON.stringify(q.costSummary || q).slice(0, 600));
  } catch (e) { console.log(`quote ${shippingMethod} error:`, e.message); }
}
