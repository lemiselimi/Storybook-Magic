export default function PrivacyPage() {
  const sections = [
    {
      title: "1. What We Collect",
      body: "When you use My Tiny Tales, we collect the photo you upload, the child's first name and age you provide, and standard usage data (browser type, page views) via privacy-respecting analytics. We do not collect payment card details — those are handled entirely by Stripe.",
    },
    {
      title: "2. How We Use Your Data",
      body: "Your photo is used solely to train a personalised AI character for your storybook. The child's name and age are used to customise the story text. We do not use this information for advertising, profiling, or any secondary purpose.",
    },
    {
      title: "3. Photo Deletion",
      body: "Uploaded photos are processed securely and deleted from our systems once the AI character model has been created — typically within minutes of upload. We do not store, view, or share your photos.",
    },
    {
      title: "4. Children's Privacy",
      body: "My Tiny Tales is designed to be used by parents and guardians on behalf of children. We do not knowingly collect personal data directly from children under 13. If you believe a child has submitted data without parental consent, please contact us and we will delete it immediately.",
    },
    {
      title: "5. Data Sharing",
      body: "We use Stripe for payments, fal.ai for AI image generation, and Vercel for hosting. Each is bound by their own privacy policies. We do not sell, rent, or share your personal data with any other third parties.",
    },
    {
      title: "6. Cookies",
      body: "We use a minimal set of first-party cookies to keep the creation flow working across page loads (e.g. storing your storybook reference). We do not use tracking or advertising cookies.",
    },
    {
      title: "7. Your Rights",
      body: "You may request access to, correction of, or deletion of any personal data we hold about you. Contact us at hello@mytinytales.studio and we will respond within 30 days.",
    },
    {
      title: "8. Contact",
      body: "For any privacy-related questions, email us at hello@mytinytales.studio. This policy was last updated April 2025.",
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#0D0820", color: "#EDE8D5", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: "#F5A623" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 17, color: "#B8A9C9", marginBottom: 56 }}>
          We take your family's privacy seriously. Here's exactly what we collect and why.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {sections.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#EDE8D5" }}>
                {s.title}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#B8A9C9", margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
