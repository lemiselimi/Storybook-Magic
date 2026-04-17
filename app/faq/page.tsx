export default function FAQPage() {
  const faqs = [
    {
      q: "How does it work?",
      a: "Upload a photo of your child, tell us their name and age, and we'll create a personalised AI character that looks just like them. Within minutes you'll have a beautifully illustrated 6-scene storybook starring your little one.",
    },
    {
      q: "What photo should I use?",
      a: "A clear, well-lit front-facing photo works best — a recent selfie or portrait photo is ideal. The better the photo, the more the character will resemble your child.",
    },
    {
      q: "How long does it take?",
      a: "Your personalised character is created in 3–4 minutes. All 6 illustrated scenes are then generated in about 2 more minutes. Total time from photo to preview: roughly 5–6 minutes.",
    },
    {
      q: "Is my child's photo stored?",
      a: "No. Photos are processed securely and never stored on our servers after the character model is built. We take children's privacy seriously.",
    },
    {
      q: "Can I preview before paying?",
      a: "Yes — you get a full preview of all 6 illustrated scenes completely free. You only pay when you decide to download or order a print.",
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
      a: "Yes — we support children aged 1–10. The story themes and reading level adapt to the age you enter.",
    },
    {
      q: "What if the preview doesn't look right?",
      a: "You can re-generate individual scenes that don't look perfect, completely free before you pay. If you're still not happy after purchase, contact us at hello@mytinytales.studio.",
    },
    {
      q: "Do you offer refunds?",
      a: "If your download is defective or your book is significantly different from the preview, we'll make it right. Contact us within 7 days of purchase.",
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#0D0820", color: "#EDE8D5", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: "#F5A623" }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: 17, color: "#B8A9C9", marginBottom: 56 }}>
          Everything you need to know about creating your personalised storybook.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {faqs.map((item, i) => (
            <div
              key={i}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                padding: "28px 0",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#EDE8D5" }}>
                {item.q}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "#B8A9C9", margin: 0 }}>
                {item.a}
              </p>
            </div>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 28 }} />
        </div>

        <div style={{ marginTop: 56, textAlign: "center" }}>
          <p style={{ color: "#B8A9C9", marginBottom: 16 }}>Still have questions?</p>
          <a
            href="mailto:hello@mytinytales.studio"
            style={{
              display: "inline-block",
              background: "#F5A623",
              color: "#0D0820",
              fontWeight: 700,
              padding: "14px 32px",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 16,
            }}
          >
            Email Us
          </a>
        </div>
      </div>
    </main>
  );
}
