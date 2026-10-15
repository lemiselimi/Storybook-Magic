// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for every product fact shown on the site.
// Audited from the live application + Prodigi configuration (Sep 2026).
// Do NOT hard-code these numbers in components — import PRODUCT from here so
// every page stays consistent. Update values in this file only.
// ─────────────────────────────────────────────────────────────────────────────

import { PRICING, SHIPPING } from "./commerce.js";

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
  // Numbers live in lib/commerce.js (the server-side trusted config) and are
  // re-exported here for display, so there is exactly one place to change a
  // price. Stripe price ids live in env.
  //
  // NOTE: the print price does NOT include shipping — shipping is charged
  // separately at checkout. Always present print as "$29.99 + shipping".
  pricing: PRICING,
  shipping: SHIPPING,

  // ── Trust & policy ────────────────────────────────────────────────────────
  photoDeletionHours: 48, // reference photo auto-deletes from the AI provider
  refundDays: 30, // 30-day happiness promise (fix-first)
} as const;

export type Product = typeof PRODUCT;
