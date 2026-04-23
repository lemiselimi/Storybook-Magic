import Link from "next/link";

const sections = [
  {
    title: "1. What We Collect",
    body: "When you use My Tiny Tales, we collect:\n\n• Photos you upload (see Section 3 for deletion timescales)\n• Your child's first name, approximate age, and chosen adventure theme\n• Standard usage data (browser type, page views) via Google Analytics — only if you have given explicit cookie consent\n• Payment details are handled entirely by Stripe; we never receive or store card numbers.",
  },
  {
    title: "2. How We Use Your Data",
    body: "Your photo is used solely to create a personalised AI character for your storybook. The child's name and age are used to customise the story text. We do not use this information for advertising, profiling, or any secondary purpose.",
  },
  {
    title: "3. Photo Deletion",
    body: "Uploaded photos are automatically stripped of all metadata (including GPS location) before processing. They are sent securely to fal.ai for AI character generation and permanently deleted from all systems — including fal.ai's infrastructure — within approximately 30 minutes of your book being generated. We do not store, view, or share your photos. See our Children's Data page for full details.",
  },
  {
    title: "4. Children's Privacy",
    body: "My Tiny Tales is designed to be used by parents and guardians on behalf of children. We do not knowingly collect personal data directly from children under 13, and we do not require children to interact with our service. If you believe a child has submitted data without parental consent, please contact us and we will delete it immediately.",
  },
  {
    title: "5. AI Provider Data Retention",
    body: "We use the following AI services:\n\n• fal.ai (image generation) — images are processed in isolated pipelines, not used for model training, and deleted within 30 minutes of generation completing.\n• Anthropic Claude (story text) — story prompts are processed in real time. Anthropic does not store API inputs for training by default for API customers.\n\nNeither provider uses your data to train models.",
  },
  {
    title: "6. Data Sharing",
    body: "We use the following sub-processors:\n\n• Stripe — payment processing (PCI-DSS compliant; never sees photo or story data)\n• fal.ai — AI image generation (EU Standard Contractual Clauses apply)\n• Anthropic — story text generation (US; EU SCCs apply)\n• Vercel — hosting and edge delivery\n• Google Analytics — aggregate usage analytics (only with your consent)\n\nWe do not sell, rent, or share your personal data with any other third parties.",
  },
  {
    title: "7. Cookies",
    body: "We use cookies in the following categories:\n\n• Necessary — session cookies required to keep the creation flow working. Cannot be disabled.\n• Analytics — Google Analytics (GA4) to understand how visitors use the site. Only set after you give explicit consent.\n• Marketing — not currently used.\n\nYou can change your cookie preferences at any time via the Cookie Settings link in the footer.",
  },
  {
    title: "8. Cookie Consent Expiry",
    body: "We store your cookie preference for 6 months, after which we will ask again. This is in line with UK ICO guidance on PECR.",
  },
  {
    title: "9. Your Rights",
    body: "Under UK GDPR you have the right to access, rectify, erase, restrict, or port your data, and to object to processing. To exercise any of these rights, email hello@mytinytales.studio with 'Data Request' in the subject line. We will respond within 30 days.\n\nYou also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.",
  },
  {
    title: "10. Contact",
    body: "Data controller: My Tiny Tales Ltd · hello@mytinytales.studio\n\nThis policy was last updated April 2026.",
  },
];

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0F0B1F", color: "#F5F0E0", fontFamily: "var(--font-inter, sans-serif)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" style={{ color: "#E8C07A", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 40, opacity: 0.8 }}>
          ← Back to home
        </Link>
        <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 42, fontWeight: 600, marginBottom: 8, color: "#F5F0E0", lineHeight: 1.1 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 15, color: "rgba(245,240,224,0.6)", marginBottom: 56, lineHeight: 1.6 }}>
          We take your family's privacy seriously. Here's exactly what we collect, how we use it, and your rights under UK GDPR.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          {sections.map((s, i) => (
            <div key={i}>
              <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#F5F0E0" }}>{s.title}</h2>
              {s.body.split("\n\n").map((para, j) => (
                <p key={j} style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(245,240,224,0.6)", margin: "0 0 12px", whiteSpace: "pre-line" }}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
