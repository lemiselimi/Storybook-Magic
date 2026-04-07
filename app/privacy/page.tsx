import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — My Tiny Tales" };

const PURPLE_DARK = "#1a0a2e";
const GOLD = "#f4c430";

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#fffef7", fontFamily: "var(--font-inter, 'Segoe UI', sans-serif)" }}>
      {/* Nav */}
      <nav style={{ background: PURPLE_DARK, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{ fontSize: 22 }}>✨</span>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: 18, color: "white" }}>My Tiny Tales</span>
        </Link>
        <Link href="/create" style={{ textDecoration: "none", padding: "8px 20px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 13 }}>
          Create a Book →
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 32px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 38, fontWeight: 700, color: PURPLE_DARK, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "#8a6d5a", fontSize: 14, marginBottom: 40 }}>Last updated: April 2026</p>

        {[
          {
            title: "1. Information We Collect",
            body: `We collect information you provide directly: your child's first name, age, gender, hair colour, and eye colour to personalise the storybook. We collect the photo you upload solely to generate your book's illustrations. We also collect your email address if you choose to share it for lead capture or order confirmation.

We automatically collect usage data such as pages visited, browser type, and device information through Google Analytics 4 to improve our service.`,
          },
          {
            title: "2. How We Use Your Information",
            body: `We use your information to: generate your personalised storybook illustrations and story text; send you your preview link or order confirmation by email if requested; process your payment securely via Stripe; and improve our product through anonymous analytics.

We do not use your child's photo or personal details for any purpose other than generating your book.`,
          },
          {
            title: "3. Photo Deletion",
            body: `Your child's photo is used only to generate the book illustrations and is permanently deleted from our systems immediately after generation is complete. We do not store, archive, or share photos. The AI image generation is handled by fal.ai, whose privacy policy governs data processed on their servers during generation. fal.ai does not retain images after the generation request completes.`,
          },
          {
            title: "4. Data Sharing",
            body: `We share data only with trusted service providers necessary to operate our service:

• Stripe — for secure payment processing (your card details are never stored by us)
• Anthropic — for AI story generation (text only, no photos)
• fal.ai — for AI image generation (photos used transiently during generation only)
• Resend — for transactional email delivery
• Google Analytics — for anonymous usage analytics

We do not sell, rent, or trade your personal information to third parties.`,
          },
          {
            title: "5. Cookies",
            body: `We use cookies to remember your cookie consent preference and to enable Google Analytics 4 analytics. Analytics cookies are only set after you accept our cookie banner. You can decline cookies and still use the core service.`,
          },
          {
            title: "6. Children's Privacy",
            body: `My Tiny Tales is designed for parents and caregivers to create books for children — it is not directed at children themselves. We do not knowingly collect personal information directly from children under 13. The child's name and photo are provided by the parent or guardian and used solely to create the book.`,
          },
          {
            title: "7. Data Retention",
            body: `Email addresses are retained only for as long as necessary to fulfil your order or respond to your enquiry. You may request deletion at any time by emailing hello@mytinytales.studio. Analytics data is retained in Google Analytics per their standard retention settings (26 months by default). Stripe payment records are retained per their standard policy for financial compliance.`,
          },
          {
            title: "8. Your Rights",
            body: `Depending on your location, you may have the right to access, correct, or delete your personal data; object to or restrict processing; and data portability. To exercise any of these rights, contact us at hello@mytinytales.studio. We will respond within 30 days.`,
          },
          {
            title: "9. Contact",
            body: `If you have questions about this Privacy Policy, please contact us at hello@mytinytales.studio or through our Contact page.`,
          },
        ].map((s) => (
          <section key={s.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 20, fontWeight: 700, color: PURPLE_DARK, marginBottom: 12 }}>{s.title}</h2>
            {s.body.split("\n\n").map((para, i) => (
              <p key={i} style={{ color: "#3d2b1f", fontSize: 15, lineHeight: 1.8, margin: "0 0 12px" }}>{para}</p>
            ))}
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ background: PURPLE_DARK, padding: "24px 32px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
          © {new Date().getFullYear()} My Tiny Tales ·{" "}
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms</Link>
          {" · "}
          <Link href="/contact" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Contact</Link>
        </p>
      </footer>
    </div>
  );
}
