// ─────────────────────────────────────────────────────────────────────────────
// TRUSTED SERVER-SIDE COMMERCE CONFIGURATION
//
// This is the numeric source of truth for what we charge and how we fulfil.
// `lib/product.ts` re-exports these values for display, so prices live in
// exactly one place. Plain JS (not TS) so the `node --test` suite can import it
// directly without a loader.
//
// NOTHING here may ever be taken from the client. The browser sends a plan and
// (implicitly, via Stripe) a shipping choice; every price, Stripe id and print
// service is resolved here, server-side.
// ─────────────────────────────────────────────────────────────────────────────

/** The only product plans that exist. Anything else is rejected. */
export const PLANS = ["digital", "print"];

/** The only shipping methods a print order may use. */
export const SHIPPING_METHODS = ["standard", "express"];

/** Customer-facing prices (USD). The print price does NOT include shipping. */
export const PRICING = {
  currency: "USD",
  digital: {
    amount: 17.99,
    label: "$17.99",
    name: "Digital Tiny Tale",
    blurb: "Personalised digital storybook.",
  },
  print: {
    amount: 29.99,
    label: "$29.99",
    name: "Printed Tiny Tale",
    blurb: "Printed personalised book + digital copy.",
    // The printed product bundles the digital book...
    includesDigital: true,
    // ...but shipping is charged separately at checkout.
    includesShipping: false,
  },
};

/** Customer-facing shipping, charged only on print orders. */
export const SHIPPING = {
  standard: { amount: 6.99, label: "$6.99", name: "Standard Shipping" },
  express: { amount: 19.99, label: "$19.99", name: "Express Shipping" },
};

// ── Prodigi fulfilment mapping ───────────────────────────────────────────────
// VERIFIED against the LIVE Prodigi API on 2026-09-17 via POST /v4.0/quotes for
// SKU BOOK-FE-8_3-SQ-SOFT-G, 22 pages, destination US
// (scripts/prodigi-shipping-verify.mjs reproduces this):
//
//   requested   accepted   resolved as   provider shipping cost
//   Budget      yes        Budget        $7.60
//   Standard    yes        Standard      $7.60
//   Express     yes        Express       $20.50
//   Overnight   NO         —             not offered for this SKU/destination
//
// Express is a genuinely distinct, more expensive service, so selling it is
// safe. Do NOT add a mapping here that has not been verified the same way — an
// unverified value means charging for Express and shipping Standard.
export const PRODIGI_SHIPPING_SERVICE = {
  standard: "Standard",
  express: "Express",
};

export const isValidPlan = (plan) => PLANS.includes(plan);
export const isValidShippingMethod = (method) => SHIPPING_METHODS.includes(method);

/** Coerce loose input ("Standard", " EXPRESS ") to our internal vocabulary, or null. */
export function normalizeShippingMethod(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return isValidShippingMethod(key) ? key : null;
}

/**
 * The Prodigi service for an internal shipping method.
 * Throws rather than defaulting: silently downgrading a paid Express order to
 * Standard fulfilment is the exact failure this module exists to prevent.
 */
export function prodigiServiceFor(method) {
  const key = normalizeShippingMethod(method);
  const service = key && PRODIGI_SHIPPING_SERVICE[key];
  if (!service) {
    throw new Error(
      `Unresolved shipping method "${method}" — refusing to guess a Prodigi service.`,
    );
  }
  return service;
}

/** Amount in minor units (cents), for comparing against Stripe. */
export const toMinorUnits = (amount) => Math.round(Number(amount) * 100);

/**
 * Work out which shipping method the customer actually paid for, reading ONLY
 * the Stripe session (the authoritative record of what was charged).
 *
 * Two strategies, in order of trust:
 *   1. The selected shipping-rate id matches a configured Dashboard rate.
 *   2. The amount charged matches one of our known shipping prices.
 *
 * Returns null when it cannot be resolved — callers must fail closed.
 */
export function shippingMethodFromStripeSession(session, env = {}) {
  const cost = session?.shipping_cost;
  if (!cost) return null;

  // 1. Match the Stripe Shipping Rate id against configured env ids.
  const rateId =
    typeof cost.shipping_rate === "string" ? cost.shipping_rate : cost.shipping_rate?.id;
  if (rateId) {
    if (rateId === env.STRIPE_SHIPPING_STANDARD) return "standard";
    if (rateId === env.STRIPE_SHIPPING_EXPRESS) return "express";
  }

  // 2. Fall back to the amount actually charged. Works for inline rates, which
  //    have server-generated ids we cannot know ahead of time.
  const paid = cost.amount_total ?? cost.amount_subtotal;
  if (typeof paid === "number") {
    if (paid === toMinorUnits(SHIPPING.standard.amount)) return "standard";
    if (paid === toMinorUnits(SHIPPING.express.amount)) return "express";
  }

  return null;
}

/**
 * Stripe `shipping_options` for a print checkout.
 *
 * Prefers Dashboard-managed Shipping Rate objects when their ids are in the
 * environment; otherwise builds the same prices inline. Either way the amounts
 * come from this file — the browser can never submit a shipping price.
 */
export function buildShippingOptions(env = {}) {
  const standardId = env.STRIPE_SHIPPING_STANDARD;
  const expressId = env.STRIPE_SHIPPING_EXPRESS;

  if (standardId && expressId) {
    return [{ shipping_rate: standardId }, { shipping_rate: expressId }];
  }

  const inline = (key) => ({
    shipping_rate_data: {
      type: "fixed_amount",
      display_name: SHIPPING[key].name,
      fixed_amount: {
        amount: toMinorUnits(SHIPPING[key].amount),
        currency: PRICING.currency.toLowerCase(),
      },
      // Declared so Stripe Tax can be switched on later without reissuing
      // rates. Inclusive/exclusive must match the Price objects.
      tax_behavior: "exclusive",
    },
  });

  return [inline("standard"), inline("express")];
}
