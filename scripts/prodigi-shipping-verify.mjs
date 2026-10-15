// Read-only verification of Prodigi shipping services for our SKU.
// Places NO order — /quotes only. Run before enabling Express fulfillment.
//   node scripts/prodigi-shipping-verify.mjs
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const env = await fs.readFile(path.join(root, ".env.local"), "utf8");
const readEnv = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] || "").trim();

const KEY = readEnv("PRODIGI_API_KEY");
if (!KEY) { console.error("PRODIGI_API_KEY missing from .env.local"); process.exit(1); }
const IS_LIVE = readEnv("PRODIGI_ENV").toLowerCase() === "live";
const BASE = IS_LIVE ? "https://api.prodigi.com/v4.0" : "https://api.sandbox.prodigi.com/v4.0";
const SKU = process.argv[2] || readEnv("PRODIGI_SKU");
const PAGES = Number(process.argv[3] || 22);
const COUNTRY = process.argv[4] || "US";

const headers = { "X-API-Key": KEY, "Content-Type": "application/json" };
console.log(`env: ${IS_LIVE ? "LIVE" : "SANDBOX"} | sku: ${SKU} | pages: ${PAGES} | dest: ${COUNTRY}\n`);

// Prodigi's documented shippingMethod values. We verify each against the real
// API rather than trusting the docs blindly.
const METHODS = ["Budget", "Standard", "Express", "Overnight"];
const rows = [];

for (const method of METHODS) {
  const res = await fetch(`${BASE}/quotes`, {
    method: "POST", headers,
    body: JSON.stringify({
      shippingMethod: method,
      destinationCountryCode: COUNTRY,
      currencyCode: "USD",
      items: [{ sku: SKU, copies: 1, assets: [{ printArea: "default", pageCount: PAGES }] }],
    }),
  });
  const text = await res.text();
  if (!res.ok) { rows.push({ method, ok: false, detail: `${res.status} ${text.slice(0, 120)}` }); continue; }

  const data = JSON.parse(text);
  const q = data.quotes?.[0];
  if (!q) { rows.push({ method, ok: false, detail: "no quote returned" }); continue; }

  rows.push({
    method,
    ok: true,
    // What Prodigi actually resolved this request to — the value that matters.
    resolved: q.shipmentMethod ?? "(not echoed)",
    items: q.costSummary?.items?.amount,
    shipping: q.costSummary?.shipping?.amount,
    ship: q.shipments?.map((s) => `${s.carrier?.name ?? "?"}/${s.carrier?.service ?? "?"}`).join(", ") || "-",
  });
}

console.log("requested   ok     resolved-as     items    shipping   carrier/service");
for (const r of rows) {
  if (!r.ok) { console.log(`${r.method.padEnd(11)} FAIL   ${r.detail}`); continue; }
  console.log(
    `${r.method.padEnd(11)} ok     ${String(r.resolved).padEnd(15)} ${String(r.items).padEnd(8)} ${String(r.shipping).padEnd(10)} ${r.ship}`,
  );
}

const valid = rows.filter((r) => r.ok);
const distinct = new Set(valid.map((r) => r.shipping));
console.log(`\n${valid.length}/${METHODS.length} methods accepted; ${distinct.size} distinct shipping price(s).`);
console.log("Express is only safe to sell if it is accepted AND priced differently from Standard.");
