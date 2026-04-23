import Link from "next/link";

const sections = [
  {
    title: "1. Who We Are",
    body: "My Tiny Tales is operated by My Tiny Tales Ltd, a company registered in England and Wales. You can contact us at hello@mytinytales.studio. References to \u2018we\u2019, \u2018us\u2019, and \u2018our\u2019 refer to My Tiny Tales Ltd.",
  },
  {
    title: "2. What We Offer",
    body: "My Tiny Tales is an AI-powered personalised storybook service. You upload a photo of your child, provide their name and age, and choose an adventure theme. We use artificial intelligence to generate a bespoke illustrated storybook in which your child appears as the hero. You may preview 2 pages free of charge; full 6-page books require payment.",
  },
  {
    title: "3. Eligibility",
    body: "You must be at least 18 years old to purchase from My Tiny Tales. By placing an order you confirm that you are purchasing on behalf of yourself or as parent/guardian of the child featured in the book. You must not upload photos of children without the consent of their parent or legal guardian.",
  },
  {
    title: "4. Orders and Payment",
    body: "All prices are shown in GBP and include VAT where applicable. Payment is processed securely by Stripe — we never see or store your card details. Your order is confirmed when you receive an email confirmation. We reserve the right to cancel any order at our discretion and will issue a full refund in that event.",
  },
  {
    title: "5. Digital Downloads",
    body: "Upon successful payment you will receive a high-resolution PDF download of your personalised storybook. Digital products are delivered immediately. You may print your book as many times as you like for personal, non-commercial use. See our Refunds Policy for information on when a refund may be available.",
  },
  {
    title: "6. Print Orders",
    body: "If you add a print-and-ship option, physical books are produced and fulfilled by our print partner and typically delivered within 5–10 business days. Delivery timescales are estimates only. Risk of loss passes to you on dispatch. See our Refunds Policy for damaged-in-transit claims.",
  },
  {
    title: "7. Intellectual Property",
    body: "The story text and illustrations generated for your book are created uniquely for you and you are granted a personal, non-exclusive licence to use them for private, non-commercial purposes. You may not sell, redistribute, or use the generated content commercially without our written permission. My Tiny Tales retains all underlying intellectual property rights in the platform and generation models.",
  },
  {
    title: "8. Acceptable Use",
    body: "You agree not to upload photos that depict illegal content, are sexually suggestive, or infringe a third party's rights. You agree not to attempt to circumvent our safety systems, reverse-engineer our service, or use our platform to generate content that violates our content policies. We may suspend or terminate your access if these terms are breached.",
  },
  {
    title: "9. AI-Generated Content",
    body: "Our storybooks are produced using generative AI. Whilst we take care to produce high-quality, safe, and appropriate output, the likeness of the generated character is an artistic interpretation — not a photographic reproduction. Results may vary based on the quality and angle of the submitted photo.",
  },
  {
    title: "10. Photo Data & Children's Privacy",
    body: "Photos you upload are used solely to generate your personalised storybook. Your photos are never used to train AI models, sold to third parties, or retained after your book is generated. Images are processed through fal.ai's secure EU infrastructure and permanently deleted within minutes of generation completing. See our Children's Data page for full details.",
  },
  {
    title: "11. Limitation of Liability",
    body: "To the maximum extent permitted by law, My Tiny Tales shall not be liable for any indirect, incidental, or consequential loss. Our total liability for any claim arising from these terms shall not exceed the amount paid by you for the relevant order. Nothing in these terms excludes liability for death or personal injury caused by our negligence, or for fraud.",
  },
  {
    title: "12. Governing Law",
    body: "These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales. If you are a consumer in the EU, you may also be entitled to bring proceedings in your local courts.",
  },
  {
    title: "13. Changes to These Terms",
    body: "We may update these terms from time to time. We will notify you of material changes by email or by posting a notice on our website. Continued use of the service after changes take effect constitutes acceptance of the new terms. Last updated: April 2026.",
  },
];

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0F0B1F", color: "#F5F0E0", fontFamily: "var(--font-inter, sans-serif)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" style={{ color: "#E8C07A", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 40, opacity: 0.8 }}>
          ← Back to home
        </Link>
        <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 42, fontWeight: 600, marginBottom: 8, color: "#F5F0E0", lineHeight: 1.1 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: 15, color: "rgba(245,240,224,0.6)", marginBottom: 56, lineHeight: 1.6 }}>
          Please read these terms carefully before using My Tiny Tales. By placing an order you agree to be bound by them.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          {sections.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#F5F0E0" }}>{s.title}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(245,240,224,0.6)", margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 56, fontSize: 14, color: "rgba(245,240,224,0.35)" }}>
          Questions? Email{" "}
          <a href="mailto:hello@mytinytales.studio" style={{ color: "#E8C07A" }}>hello@mytinytales.studio</a>
        </p>
      </div>
    </main>
  );
}
