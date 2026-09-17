# Pricing, shipping and tax — operator guide

Everything customer-facing is derived from **`lib/commerce.js`**. Change a price
there and it flows to the homepage, the create flow, the FAQ, the emails and the
analytics events. `lib/product.ts` re-exports it for display.

## Current pricing

| Product | Price | Notes |
|---|---|---|
| Digital Tiny Tale | **$17.99** | No shipping. |
| Printed Tiny Tale | **$29.99 + shipping** | Includes the digital book. Shipping is **never** bundled. |

| Shipping (print only) | Charged | Provider cost | Margin |
|---|---|---|---|
| Standard | **$6.99** | $7.60 | **−$0.61** |
| Express | **$19.99** | $20.50 | **−$0.51** |

Shipping runs at a small loss on both tiers; the book margin absorbs it easily
(print item cost is **$8.86** at 22 pages, so a standard order nets roughly
**$20.52** before Stripe fees). This is a deliberate choice — raise the shipping
prices here if that stops being acceptable.

## Stripe Dashboard objects you must create

The code works today without these (it falls back to inline shipping rates built
from `lib/commerce.js`), but Dashboard-managed objects are preferred for
production because they are reportable and editable without a deploy.

### 1. Prices

| Env var | What to create |
|---|---|
| `STRIPE_PRICE_DIGITAL` | One-time price, **$17.99 USD**, on a "Digital Tiny Tale" product |
| `STRIPE_PRICE_PRINT` | One-time price, **$29.99 USD**, on a "Printed Tiny Tale" product |

`STRIPE_PRICE_PRINT` almost certainly needs updating — the live price is still
the old **$37.99** object. **Create a new Price and repoint the env var**; do not
edit an existing Price's amount (Stripe prices are immutable, and editing breaks
historical reporting).

### 2. Shipping rates

| Env var | What to create |
|---|---|
| `STRIPE_SHIPPING_STANDARD` | Shipping rate, fixed **$6.99 USD**, display name "Standard Shipping" |
| `STRIPE_SHIPPING_EXPRESS` | Shipping rate, fixed **$19.99 USD**, display name "Express Shipping" |

Set **both or neither**. With only one set, the code falls back to inline rates
for both so the customer never sees a mismatched pair.

### 3. Optional

| Env var | Default | Effect |
|---|---|---|
| `STRIPE_AUTOMATIC_TAX` | unset (off) | `true` enables `automatic_tax` on Checkout. **Do not set this until the tax section below is done.** |

`PRODIGI_SHIPPING` is no longer read. Shipping now comes from what the customer
actually paid; the variable can be deleted.

## Stripe Tax — current status: NOT ENABLED

`automatic_tax` is off and stays off until someone with authority confirms the
registrations. The architecture is ready: shipping rates declare
`tax_behavior: "exclusive"`, and the switch is one env var.

Before enabling, all of the following must be true:

1. **Tax registrations added** in Stripe → Tax → Registrations, for every
   jurisdiction where there is a real obligation. Only the owner/accountant can
   decide this. Nexus is a legal question, not a code question.
2. **A tax code on each product.** These are *not* interchangeable:
   - *Printed Tiny Tale* — a physical book. Several US states tax printed books
     at a reduced rate or exempt them, so the generic tangible-goods code is
     likely wrong.
   - *Digital Tiny Tale* — a digital download, taxed differently again, and
     differently across states.
   - *Shipping* — taxable in some states, not in others, and sometimes only when
     the goods are taxable.

   Pick each one from the Dashboard's tax-code picker. **No tax codes are
   hardcoded in this repo, deliberately** — choosing wrong creates a real
   liability, and it is not a decision code should make silently.
3. **`tax_behavior` set on both Price objects** (inclusive or exclusive) to match
   the `exclusive` already declared on the shipping rates. Enabling automatic tax
   with an unspecified `tax_behavior` will error at Checkout.

Then set `STRIPE_AUTOMATIC_TAX=true` and test in Stripe test mode with addresses
in several states before going live.

## Prodigi shipping mapping

Verified against the **live** Prodigi API on 2026-09-17 (`POST /v4.0/quotes`,
SKU `BOOK-FE-8_3-SQ-SOFT-G`, 22 pages, US). Reproduce with:

```bash
node scripts/prodigi-shipping-verify.mjs
```

| Internal | Prodigi service | Verified | Provider shipping cost |
|---|---|---|---|
| `standard` | `Standard` | yes | $7.60 |
| `express` | `Express` | yes | $20.50 |
| — | `Budget` | yes (unused) | $7.60 |
| — | `Overnight` | **not offered** for this SKU/destination | — |

Re-run the verifier before adding a destination country or changing SKU. A
method that cannot be verified must not be sold — `prodigiServiceFor()` throws
rather than defaulting, so an unmapped method aborts fulfilment instead of
quietly shipping Standard on Express money.

## How the shipping choice survives

1. **Checkout** — `shipping_options` are attached server-side for print only.
2. **Payment** — the customer picks a rate; Stripe records it on the session.
3. **Webhook** — resolved and written to `order:<sessionId>` and `result:<ref>`.
4. **Fulfilment** — `lib/prodigi.js` re-derives it **from the Stripe session**
   (authoritative), falling back to the KV copy, then maps to a verified Prodigi
   service.
5. **Prodigi order** — sent as `shippingMethod` and recorded in the order
   metadata alongside `ref` and `sessionId`.

Resolution order is by configured shipping-rate id first, then by the exact
amount charged. If a session has a `shipping_cost` that matches neither,
fulfilment **fails closed** and alerts. Legacy orders from before shipping was
charged separately have no `shipping_cost` at all and are fulfilled as Standard,
which is what was sold under the old bundled price.
