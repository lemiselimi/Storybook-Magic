// One-shot Prodigi validation: create a real order with our interior PDF, inspect
// what Prodigi says (accepted? held? asset issues?), then CANCEL it immediately so
// nothing is charged or printed. Used because there's no sandbox key available.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env  = await fs.readFile(path.join(root, ".env.local"), "utf8");
const rd   = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] || "").trim();

const KEY = rd("PRODIGI_API_KEY");
const SKU = rd("PRODIGI_SKU") || "BOOK-FE-8_3-SQ-SOFT-G";
const LIVE = rd("PRODIGI_ENV").toLowerCase() === "live";
const BASE = LIVE ? "https://api.prodigi.com/v4.0" : "https://api.sandbox.prodigi.com/v4.0";
const H = { "X-API-Key": KEY, "Content-Type": "application/json" };

// Known-good 32-page square interior PDF (rebuilt earlier for book 06599c0f).
const INTERIOR = "https://v3b.fal.media/files/b/0aa7c713/aQfLuENR4PoTEbb8twQkk_interior.pdf";
const PAGES = 32;

console.log(`env: ${LIVE ? "LIVE" : "sandbox"} | sku: ${SKU} | pages: ${PAGES}\n`);

const body = {
  shippingMethod: "Budget",
  recipient: {
    name: "TEST - cancel immediately",
    email: "test@example.com",
    address: {
      line1: "14 Test Place", postalOrZipCode: "90001",
      countryCode: "US", townOrCity: "Los Angeles", stateOrCounty: "CA",
    },
  },
  items: [{
    sku: SKU, copies: 1, sizing: "fillPrintArea",
    assets: [{ printArea: "default", url: INTERIOR, pageCount: PAGES }],
  }],
};

// 1. Create
const cRes = await fetch(`${BASE}/Orders`, { method: "POST", headers: H, body: JSON.stringify(body) });
const cJson = await cRes.json();
console.log("=== CREATE ===", cRes.status, "outcome:", cJson.outcome);
const order = cJson.order;
if (!order?.id) { console.log("no order id — full response:\n", JSON.stringify(cJson, null, 2)); process.exit(1); }
console.log("orderId:", order.id);
console.log("status:", JSON.stringify(order.status));
console.log("charges:", JSON.stringify(order.charges || order.cost || "n/a"));

// 2. Fetch full order (asset validation surfaces here)
const gRes = await fetch(`${BASE}/Orders/${order.id}`, { headers: H });
const gJson = await gRes.json();
console.log("\n=== ORDER DETAIL ===", gRes.status);
console.log("stage:", gJson.order?.status?.stage, "| issues:", JSON.stringify(gJson.order?.status?.issues || []));

// 3. Cancel (so it never produces/charges)
const kRes = await fetch(`${BASE}/Orders/${order.id}/actions/cancel`, { method: "POST", headers: H });
const kJson = await kRes.json().catch(() => ({}));
console.log("\n=== CANCEL ===", kRes.status, "outcome:", kJson.outcome, JSON.stringify(kJson.order?.status?.stage || kJson));
