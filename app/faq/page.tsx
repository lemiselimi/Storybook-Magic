"use client";
import { useState } from "react";
import Link from "next/link";

const PURPLE_DARK = "#1a0a2e";
const PURPLE_MID = "#2d1b4e";
const GOLD = "#f4c430";

const FAQS = [
  {
    q: "How long does it take to create a book?",
    a: "Your free preview (first 2 pages) is ready in under 2 minutes. Once you purchase, the full 6-page illustrated book is generated and available to download immediately — usually within 90 seconds. Print orders are produced and shipped within 5–7 business days.",
  },
  {
    q: "What photo works best?",
    a: "For the best results use a clear, well-lit photo where your child's face is plainly visible and looking towards the camera. Avoid photos with sunglasses, heavy shadows, multiple people in frame, or blurry faces. A simple portrait photo or a recent clear selfie works perfectly. The higher the quality of the photo, the better the resemblance in the illustrations.",
  },
  {
    q: "Is my child's photo safe?",
    a: "Absolutely. Your child's photo is used only to generate the book illustrations and is permanently deleted from our systems immediately after the generation is complete. We never store, archive, or share photos. The image processing is handled by fal.ai, a trusted AI infrastructure provider, and photos are not retained after your request completes. See our Privacy Policy for full details.",
  },
  {
    q: "Can I order a printed copy?",
    a: "Yes! Our Print + Digital option ($44.99) includes a premium hardcover book with lay-flat binding, plus the instant digital PDF. The book is printed and shipped within 5–7 business days, with gift wrapping available. We ship worldwide.",
  },
  {
    q: "How do I get a refund?",
    a: "We offer a 30-day satisfaction guarantee. If you are not happy with your book for any reason, email us at hello@mytinytales.studio within 30 days of your purchase. We'll either regenerate the book with adjusted settings until you're delighted, or issue a full refund — your choice. We want every family to love their book.",
  },
  {
    q: "Can I customise the story theme?",
    a: "Yes — during the creation flow you can choose from 6 adventure themes: The Big Adventure, Dragon Tamer, To The Stars, Deep Blue, Jungle Crown, and My Superpower. The AI writes a completely unique story tailored to your chosen theme and your child's name, age, and personality.",
  },
  {
    q: "Can I share the book with family?",
    a: "Yes. After your book is generated you'll see a 'Share Book' button that copies a shareable link. Anyone with the link can view the full book — great for sending to grandparents or family far away.",
  },
  {
    q: "What format is the digital download?",
    a: "The digital book is a high-quality PDF, formatted for A4 landscape (the standard double-page spread format). You can print it at home on any printer, send it to a local print shop, or simply read it on screen.",
  },
  {
    q: "Do you offer books in other languages?",
    a: "Currently My Tiny Tales generates stories in English only. We're working on adding more languages — sign up for updates at hello@mytinytales.studio.",
  },
  {
    q: "What age range is the book suitable for?",
    a: "We support children aged 1–12. During setup you enter your child's age and our AI adjusts both the writing level and the illustration style accordingly — from very simple one-sentence pages for toddlers, to richer vocabulary and more complex plots for preteens.",
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
