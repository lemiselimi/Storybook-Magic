// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every product fact shown on the site.
// Audited from the live application + Prodigi configuration (Sep 2026).
// Do NOT hard-code these numbers in components — import PRODUCT from here so
// every page stays consistent. Update values in this file only.
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT = {
  name: "My Tiny Tales",
  email: "hello@mytinytales.studio",
  url: "https://mytinytales.studio",

  // ── Story & personalization ──────────────────────────────────────────────
  storyScenes: 8, // illustrated scenes in the story (one per chapter)
  freePreviewPages: 2, // pages shown free before payment
  supportedAges: { min: 1, max: 12 },
  personalizes: ["their face", "their name", "their age", "their adventure"] as const,

  // How fast the free preview is ready
  previewTime: "about 5 minutes",

  // ── Printed keepsake (Prodigi softcover, BOOK-FE-8_3-SQ-SOFT-G) ───────────
  print: {
    pageCount: 22, // pages in the printed book file
    sizeIn: "8.3 × 8.3 in",
    sizeCm: "21 × 21 cm",
    cover: "matte-laminated softcover",
    paper: "150 gsm gloss interior",
    production: "3–4 days",
    delivery: "about 1–2 weeks", // production + shipping, US
  },

  // ── Pricing (USD) ─────────────────────────────────────────────────────────
  // Stripe price IDs live in env; these are the display prices/names.
  pricing: {
    currency: "USD",
    digital: { amount: 17.99, label: "$17.99", name: "Digital Storybook" },
    print: { amount: 37.99, label: "$37.99", name: "The Keepsake Book" },
  },

  // ── Trust & policy ────────────────────────────────────────────────────────
  photoDeletionHours: 48, // reference photo auto-deletes from the AI provider
  refundDays: 30, // 30-day happiness promise (fix-first)
} as const;

export type Product = typeof PRODUCT;
