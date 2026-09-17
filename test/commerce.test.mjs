import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// lib/commerce.js is ESM-authored but the package is CommonJS for node, so load
// it the same way the other suites load lib modules.
const source = fs.readFileSync(path.resolve("lib/commerce.js"), "utf8")
  .replaceAll("export const ", "const ")
  .replaceAll("export function ", "function ");
const commerce = Function(`${source}\nreturn {
  PLANS, SHIPPING_METHODS, PRICING, SHIPPING, PRODIGI_SHIPPING_SERVICE,
  isValidPlan, isValidShippingMethod, normalizeShippingMethod, prodigiServiceFor,
  toMinorUnits, shippingMethodFromStripeSession, buildShippingOptions
};`)();

const {
  PLANS, SHIPPING_METHODS, PRICING, SHIPPING, PRODIGI_SHIPPING_SERVICE,
  isValidPlan, isValidShippingMethod, normalizeShippingMethod, prodigiServiceFor,
  toMinorUnits, shippingMethodFromStripeSession, buildShippingOptions,
} = commerce;

// ── Pricing ──────────────────────────────────────────────────────────────────

test("digital Tiny Tale is $17.99", () => {
  assert.equal(PRICING.digital.amount, 17.99);
  assert.equal(PRICING.digital.label, "$17.99");
});

test("printed Tiny Tale is $29.99 and includes the digital book", () => {
  assert.equal(PRICING.print.amount, 29.99);
  assert.equal(PRICING.print.label, "$29.99");
  assert.equal(PRICING.print.includesDigital, true);
});

test("the print price explicitly excludes shipping", () => {
  assert.equal(PRICING.print.includesShipping, false);
});

test("shipping is $6.99 standard and $19.99 express", () => {
  assert.equal(SHIPPING.standard.amount, 6.99);
  assert.equal(SHIPPING.express.amount, 19.99);
  assert.equal(toMinorUnits(SHIPPING.standard.amount), 699);
  assert.equal(toMinorUnits(SHIPPING.express.amount), 1999);
});

test("no stale $37.99 print price survives anywhere in commerce config", () => {
  assert.ok(!JSON.stringify({ PRICING, SHIPPING }).includes("37.99"));
});

// ── Plan validation ──────────────────────────────────────────────────────────

test("only digital and print are valid plans", () => {
  assert.deepEqual([...PLANS].sort(), ["digital", "print"]);
  assert.ok(isValidPlan("digital"));
  assert.ok(isValidPlan("print"));
});

test("invalid plans are rejected", () => {
  for (const bad of ["free", "PRINT", "", null, undefined, 0, "digital ", "print;drop", {}]) {
    assert.equal(isValidPlan(bad), false, `expected ${JSON.stringify(bad)} to be rejected`);
  }
});

// ── Shipping validation ──────────────────────────────────────────────────────

test("only standard and express are valid shipping methods", () => {
  assert.deepEqual([...SHIPPING_METHODS].sort(), ["express", "standard"]);
});

test("invalid shipping methods are rejected", () => {
  for (const bad of ["overnight", "free", "", null, undefined, 42, {}]) {
    assert.equal(isValidShippingMethod(bad), false);
    assert.equal(normalizeShippingMethod(bad), null);
  }
});

test("shipping method normalisation tolerates case and padding", () => {
  assert.equal(normalizeShippingMethod("Standard"), "standard");
  assert.equal(normalizeShippingMethod("  EXPRESS "), "express");
});

// ── Prodigi mapping (verified against the live API) ───────────────────────────

test("standard maps to the verified Prodigi Standard service", () => {
  assert.equal(PRODIGI_SHIPPING_SERVICE.standard, "Standard");
  assert.equal(prodigiServiceFor("standard"), "Standard");
});

test("express maps to the verified Prodigi Express service", () => {
  assert.equal(PRODIGI_SHIPPING_SERVICE.express, "Express");
  assert.equal(prodigiServiceFor("express"), "Express");
});

test("an unmapped shipping method throws rather than silently downgrading", () => {
  // The whole point: never accept Express money and ship Standard.
  for (const bad of ["overnight", "", null, undefined, "priority"]) {
    assert.throws(() => prodigiServiceFor(bad), /refusing to guess/i);
  }
});

test("only verified services appear in the Prodigi map", () => {
  // Overnight is NOT offered for this SKU/destination — it must never appear.
  assert.deepEqual(Object.keys(PRODIGI_SHIPPING_SERVICE).sort(), ["express", "standard"]);
  assert.ok(!Object.values(PRODIGI_SHIPPING_SERVICE).includes("Overnight"));
});

// ── Resolving what the customer actually paid ────────────────────────────────

test("shipping resolves from a configured Stripe shipping-rate id", () => {
  const env = { STRIPE_SHIPPING_STANDARD: "shr_std", STRIPE_SHIPPING_EXPRESS: "shr_exp" };
  assert.equal(
    shippingMethodFromStripeSession({ shipping_cost: { shipping_rate: "shr_exp", amount_total: 1999 } }, env),
    "express",
  );
  assert.equal(
    shippingMethodFromStripeSession({ shipping_cost: { shipping_rate: "shr_std", amount_total: 699 } }, env),
    "standard",
  );
});

test("shipping resolves from the amount charged when inline rates are used", () => {
  assert.equal(shippingMethodFromStripeSession({ shipping_cost: { amount_total: 699 } }, {}), "standard");
  assert.equal(shippingMethodFromStripeSession({ shipping_cost: { amount_total: 1999 } }, {}), "express");
});

test("an expanded shipping_rate object resolves too", () => {
  const env = { STRIPE_SHIPPING_EXPRESS: "shr_exp" };
  assert.equal(
    shippingMethodFromStripeSession({ shipping_cost: { shipping_rate: { id: "shr_exp" } } }, env),
    "express",
  );
});

test("an unrecognised shipping amount resolves to null so callers fail closed", () => {
  assert.equal(shippingMethodFromStripeSession({ shipping_cost: { amount_total: 1 } }, {}), null);
  assert.equal(shippingMethodFromStripeSession({ shipping_cost: { amount_total: 0 } }, {}), null);
});

test("a digital session with no shipping_cost resolves to null", () => {
  assert.equal(shippingMethodFromStripeSession({}, {}), null);
  assert.equal(shippingMethodFromStripeSession({ shipping_cost: null }, {}), null);
});

// ── Stripe shipping options are built server-side ────────────────────────────

test("dashboard shipping-rate ids are preferred when configured", () => {
  const options = buildShippingOptions({
    STRIPE_SHIPPING_STANDARD: "shr_std", STRIPE_SHIPPING_EXPRESS: "shr_exp",
  });
  assert.deepEqual(options, [{ shipping_rate: "shr_std" }, { shipping_rate: "shr_exp" }]);
});

test("inline shipping rates carry the trusted server-side amounts", () => {
  const options = buildShippingOptions({});
  assert.equal(options.length, 2);
  const [standard, express] = options.map((o) => o.shipping_rate_data);
  assert.equal(standard.fixed_amount.amount, 699);
  assert.equal(express.fixed_amount.amount, 1999);
  assert.equal(standard.fixed_amount.currency, "usd");
  assert.equal(standard.type, "fixed_amount");
});

test("a partially configured environment does not mix ids with inline rates", () => {
  // Half-configured env must not produce one dashboard rate and one inline rate.
  for (const env of [{ STRIPE_SHIPPING_STANDARD: "shr_std" }, { STRIPE_SHIPPING_EXPRESS: "shr_exp" }]) {
    const options = buildShippingOptions(env);
    assert.ok(options.every((o) => o.shipping_rate_data), "expected all-inline fallback");
  }
});

test("shipping amounts cannot be influenced by caller-supplied values", () => {
  // buildShippingOptions only reads env; anything else passed is ignored.
  const options = buildShippingOptions({ shippingAmount: 1, STRIPE_SHIPPING_STANDARD: undefined });
  const amounts = options.map((o) => o.shipping_rate_data.fixed_amount.amount);
  assert.deepEqual(amounts, [699, 1999]);
});

// ── Tax readiness ────────────────────────────────────────────────────────────

test("no blanket sales-tax percentage is hardcoded", () => {
  const raw = fs.readFileSync(path.resolve("lib/commerce.js"), "utf8");
  assert.ok(!/tax_?rate|taxPercent|salesTax|\btaxRate\b/i.test(raw),
    "commerce config must not carry a hardcoded tax rate");
});

test("inline shipping rates declare a tax_behavior so Stripe Tax can be enabled", () => {
  const [standard] = buildShippingOptions({}).map((o) => o.shipping_rate_data);
  assert.equal(standard.tax_behavior, "exclusive");
});

test("digital and physical products stay distinguishable for tax treatment", () => {
  // Different tax rules apply to a physical book vs a digital download, so the
  // two must never collapse into one product shape.
  assert.notEqual(PRICING.digital.name, PRICING.print.name);
  assert.equal(PRICING.digital.includesShipping, undefined);
  assert.equal(PRICING.print.includesShipping, false);
});
