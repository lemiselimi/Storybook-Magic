"use client";
import { useState } from "react";
import Link from "next/link";

const GOLD = "#E8C07A";
const GOLD_WARM = "#D4A24C";
const TEXT = "#F5F0E0";
const MUTED = "rgba(245,240,224,0.65)";
const SURF_BDR = "rgba(255,255,255,0.08)";

const faqs = [
  {
    q: "How does it work?",
    a: "Upload a photo of your child, tell us their name and age, and we'll create a personalised AI character that looks just like them. Within minutes you'll have a beautifully illustrated 6-scene storybook starring your little one.",
  },
  {
    q: "What photo should I use?",
    a: "A clear, well-lit front-facing photo works best — a recent selfie or portrait is ideal. The better the photo, the more the character will resemble your child.",
  },
  {
    q: "How long does it take?",
    a: "Your personalised preview is ready in roughly 5-6 minutes: the story is written first, then all the illustrated scenes are generated. From photo to preview in one sitting.",
  },
  {
    q: "Is my child's photo stored?",
    a: "No. We never store your child's photo on our own servers. It's used only as a live reference to generate your book's illustrations, and is automatically deleted from our AI provider within 48 hours of upload. We take children's privacy seriously.",
  },
  {
    q: "Can I preview before paying?",
    a: "Yes — you can preview the first 2 pages of your book completely free. You only pay when you're ready to unlock all 8 pages and download or order a print.",
  },
  {
    q: "What's included in the digital download?",
    a: "A high-resolution PDF of your personalised storybook with 6 full illustrated scenes plus cover, dedication, and closing pages — ready to print at home or at any print shop.",
  },
  {
    q: "Is there a subscription?",
    a: "No subscription. You pay once per book, and it's yours forever.",
  },
  {
    q: "Can I make a book for any age?",
    a: "Yes — we support children aged 1-12. The story themes and reading level adapt to the age you enter.",
  },
  {
    q: "What if the preview doesn't look right?",
    a: "You can re-generate individual scenes that don't look perfect, completely free before you pay. If you're still not happy after purchase, contact us at hello@mytinytales.studio.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes — we back every book with a 30-day happiness promise. If you're not delighted for any reason, contact us within 30 days of purchase and we'll re-generate your book or issue a full refund. See our Refund Policy for details.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #07090F 0%, #0E1118 100%)", color: TEXT, fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" style={{ color: GOLD, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 40, opacity: 0.85 }}>
          ← Back to home
        </Link>

        <p style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 14px" }}>Help Center</p>
        <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 42, fontWeight: 600, marginBottom: 10, color: TEXT, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: 15, color: MUTED, marginBottom: 48, lineHeight: 1.6 }}>
          Everything you need to know about creating your personalised storybook.
        </p>

        <div style={{ borderTop: `1px solid ${SURF_BDR}` }}>
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderBottom: `1px solid ${SURF_BDR}` }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "22px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, textAlign: "left" }}
                >
                  <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 17, fontWeight: 600, color: isOpen ? GOLD : TEXT, transition: "color 0.2s", lineHeight: 1.4 }}>
                    {item.q}
                  </span>
                  <span aria-hidden="true" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", border: `1px solid ${isOpen ? GOLD : "rgba(245,240,224,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: isOpen ? GOLD : MUTED, transition: "transform 0.25s ease, border-color 0.2s, color 0.2s", transform: isOpen ? "rotate(45deg)" : "none", fontSize: 18, lineHeight: 1 }}>
                    +
                  </span>
                </button>
                <div style={{ display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", transition: "grid-template-rows 0.3s ease" }}>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: 15, lineHeight: 1.75, color: MUTED, margin: 0, padding: "0 4px 24px" }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 56, textAlign: "center", background: "rgba(232,192,122,0.05)", border: "1px solid rgba(232,192,122,0.18)", borderRadius: 20, padding: "36px 28px" }}>
          <p style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 20, fontWeight: 600, color: TEXT, margin: "0 0 8px" }}>Still have questions?</p>
          <p style={{ color: MUTED, fontSize: 14, margin: "0 0 22px" }}>We're happy to help — most emails get a reply within a day.</p>
          <a
            href="mailto:hello@mytinytales.studio"
            style={{ display: "inline-block", background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: "#07090F", fontWeight: 700, padding: "14px 32px", borderRadius: 50, textDecoration: "none", fontSize: 15, boxShadow: "0 8px 28px rgba(232,192,122,0.25)" }}
          >
            Email us
          </a>
        </div>
      </div>
    </main>
  );
}
