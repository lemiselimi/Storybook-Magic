"use client";
import { useState } from "react";
import Link from "next/link";

const PURPLE_DARK = "#1a0a2e";
const PURPLE_MID = "#2d1b4e";
const GOLD = "#f4c430";

const FAQS = [
  {
    q: "How long does it take to create a book?",
    a: "Your personalised preview is ready in under 2 minutes. The full 6-page book generates while you read the preview — so by the time you decide to purchase, it's already done and available to download instantly. Print orders are produced and shipped within 5–7 business days.",
  },
  {
    q: "What photo works best?",
    a: "A clear, well-lit front-facing photo works best — one where your child's face is plainly visible. One photo is enough, though uploading 3–5 photos gives better resemblance in the illustrations. Avoid sunglasses, hats, heavy shadows, or blurry images. A simple portrait or recent selfie is perfect.",
  },
  {
    q: "Is my child's photo safe?",
    a: "Your photo is used only to generate the illustrations and is permanently deleted immediately after. We never store, share, or use it for anything else — not for training AI models, not for marketing, nothing. See our Privacy Policy for full details.",
  },
  {
    q: "Can I order a printed copy?",
    a: "Yes — our Print + Digital plan ($37.99) includes a premium hardcover book with lay-flat binding, plus the instant digital PDF. The book is printed and shipped within 5–7 business days, with gift wrapping available. We ship worldwide.",
  },
  {
    q: "How do I get a refund?",
    a: "We offer a 30-day happiness promise. We handle all concerns on a case-by-case basis and are committed to your satisfaction. Email us at hello@mytinytales.studio within 30 days of your purchase and we'll work with you to make sure you love your book.",
  },
  {
    q: "Can I customise the story theme?",
    a: "Yes — you choose from 6 adventure themes: The Big Adventure, Dragon Tamer, To The Stars, Deep Blue, Jungle Crown, or My Superpower. The AI writes a completely unique story tailored to your chosen theme, your child's name, and their age.",
  },
  {
    q: "Can I share the book with family?",
    a: "Yes — your digital book comes with a shareable link you can send to grandparents and family anywhere in the world. Anyone with the link can view the full book for free.",
  },
  {
    q: "What format is the digital download?",
    a: "A high-resolution PDF, print-ready at home on standard A4 or letter paper. You can also send it to any local print shop, or simply read it on screen or tablet.",
  },
  {
    q: "Do you offer books in other languages?",
    a: "Currently English only, with more languages coming soon. Sign up for updates at hello@mytinytales.studio.",
  },
  {
    q: "What age range is the book suitable for?",
    a: "Best suited for ages 2–10. During setup you enter your child's age and the AI adjusts both the writing level and illustration style accordingly — from very simple one-sentence pages for toddlers, to richer vocabulary and more complex plots for older children.",
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#fffef7", fontFamily: "var(--font-inter, 'Segoe UI', sans-serif)" }}>
      <nav style={{ background: PURPLE_DARK, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{ fontSize: 22 }}>✨</span>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: 18, color: "white" }}>My Tiny Tales</span>
        </Link>
        <Link href="/create" style={{ textDecoration: "none", padding: "8px 20px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 13 }}>
          Create a Book →
        </Link>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 38, fontWeight: 700, color: PURPLE_DARK, marginBottom: 12 }}>Frequently Asked Questions</h1>
          <p style={{ color: "#8a6d5a", fontSize: 16, margin: 0 }}>Everything you need to know about My Tiny Tales.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, border: `1px solid ${open === i ? "rgba(107,63,160,0.25)" : "#ede8dc"}`, overflow: "hidden", boxShadow: "0 2px 12px rgba(26,10,46,0.05)", transition: "border-color 0.2s" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ width: "100%", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 17, fontWeight: 700, color: PURPLE_DARK, lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 20, color: PURPLE_MID, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 24px 22px" }}>
                  <p style={{ color: "#3d2b1f", fontSize: 15, lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, background: `linear-gradient(135deg, ${PURPLE_DARK}, ${PURPLE_MID})`, borderRadius: 20, padding: "36px 32px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, margin: "0 0 20px" }}>Still have a question? We're happy to help.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" style={{ textDecoration: "none", padding: "12px 28px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 14 }}>
              Contact Us
            </Link>
            <Link href="/create" style={{ textDecoration: "none", padding: "12px 28px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.25)", color: "white", fontWeight: 600, fontSize: 14 }}>
              Create a Book →
            </Link>
          </div>
        </div>
      </div>

      <footer style={{ background: PURPLE_DARK, padding: "24px 32px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
          © {new Date().getFullYear()} My Tiny Tales ·{" "}
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Privacy</Link>
          {" · "}
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms</Link>
        </p>
      </footer>
    </div>
  );
}
