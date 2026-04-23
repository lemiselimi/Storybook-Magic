import Link from "next/link";

export default function RefundsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0F0B1F", color: "#F5F0E0", fontFamily: "var(--font-inter, sans-serif)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" style={{ color: "#E8C07A", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 40, opacity: 0.8 }}>
          ← Back to home
        </Link>
        <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 42, fontWeight: 600, marginBottom: 8, color: "#F5F0E0", lineHeight: 1.1 }}>
          Refund Policy
        </h1>
        <p style={{ fontSize: 15, color: "rgba(245,240,224,0.6)", marginBottom: 56, lineHeight: 1.6 }}>
          We want every family to love their book. If you don't, we'll make it right.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          {[
            {
              title: "Our 30-Day Happiness Promise",
              body: `If you are not delighted with your storybook for any reason, contact us within 30 days of purchase and we will either re-generate your book at no charge or issue a full refund — whichever you prefer. No awkward questions, no hoops.

To claim: email hello@mytinytales.studio with your order number and a brief description of the issue. We aim to respond within 1 business day.`,
            },
            {
              title: "Digital Downloads",
              body: "Under UK consumer law, you lose your right of withdrawal for digital content once download has begun — however, our 30-Day Happiness Promise overrides this and gives you a full refund right regardless. If your PDF is corrupted, fails to download, or is clearly different from the approved preview pages, we will always issue a refund or replacement.",
            },
            {
              title: "Print Orders",
              body: "Print-and-ship orders are produced on-demand. We cannot accept returns for change-of-mind on personalised physical items. However:\n\n• Damaged in transit — send us a photo within 14 days and we will reprint and reship free of charge.\n• Significant quality defect (e.g. pages missing, printing error) — we will reprint or refund in full.\n• Lost in post — if Royal Mail tracking shows no delivery after 21 days (UK) or 35 days (international), we will reprint or refund.",
            },
            {
              title: "Refund Timescales",
              body: "Approved refunds are issued to the original payment method within 5–10 business days. Stripe processes refunds and timescales may vary by bank.",
            },
            {
              title: "Contact",
              body: "Email hello@mytinytales.studio — include your order number for fastest service. Last updated: April 2026.",
            },
          ].map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#F5F0E0" }}>{s.title}</h2>
              {s.body.split("\n\n").map((para, j) => (
                <p key={j} style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(245,240,224,0.6)", margin: "0 0 12px" }}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
