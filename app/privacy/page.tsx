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
    title: "3. Photo Handling",
    body: "Uploaded photos are automatically stripped of all metadata (including GPS location) before processing. We do not store your photos on our own servers — they are sent securely to fal.ai purely as a live reference for generating your book's illustrations, and are never used to train AI models. fal.ai automatically and permanently deletes the reference image within 48 hours of upload. We do not view or share your photos. See our Children's Data page for full details.",
  },
  {
    title: "4. Children's Privacy",
    body: "My Tiny Tales is designed to be used by parents and guardians on behalf of their children, consistent with the U.S. Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personal information directly from children under 13 — a parent or guardian provides the child's photo and first name. If you believe a child has provided us information without parental consent, please contact us and we will delete it promptly.",
  },
  {
    title: "5. AI Provider Data Retention",
    body: "We use the following AI services:\n\n• fal.ai (image generation) — images are processed in isolated pipelines and are not used for model training. Reference photos are set to auto-delete from fal.ai within 48 hours of upload.\n• Anthropic Claude (story text) — story prompts are processed in real time. Anthropic does not store API inputs for training by default for API customers.\n\nNeither provider uses your data to train models.",
  },
  {
    title: "6. Data Sharing",
    body: "We use the following sub-processors:\n\n• Stripe — payment processing (PCI-DSS compliant; never sees photo or story data)\n• fal.ai — AI image generation\n• Anthropic — story text generation\n• Vercel — hosting and edge delivery\n• Google Analytics — aggregate usage analytics (only with your consent)\n\nWe do not sell or rent your personal information, and we do not share it for cross-context behavioral advertising.",
  },
  {
    title: "7. Cookies",
    body: "We use cookies in the following categories:\n\n• Necessary — session cookies required to keep the creation flow working. Cannot be disabled.\n• Analytics — Google Analytics (GA4) to understand how visitors use the site. Only set after you give explicit consent.\n• Marketing — not currently used.\n\nYou can change your cookie preferences at any time via the Cookie Settings link in the footer.",
  },
  {
    title: "8. Cookie Consent Expiry",
    body: "We store your cookie preference for 6 months, after which we will ask again.",
  },
  {
    title: "9. Your Privacy Rights",
    body: "Depending on where you live — including under the California Consumer Privacy Act (CCPA/CPRA) — you may have the right to know what personal information we collect and how it is used, to access a copy of it, to request its deletion, to correct inaccurate information, and to opt out of the 'sale' or 'sharing' of personal information. We do not sell your personal information, and we do not share it for cross-context behavioral advertising. We will never discriminate against you for exercising these rights.\n\nTo exercise any of these rights, email hello@mytinytales.studio with 'Privacy Request' in the subject line. We will verify and respond within 45 days.",
  },
  {
    title: "10. Contact",
    body: "My Tiny Tales · hello@mytinytales.studio\n\nFor any privacy question or request, email us with 'Privacy Request' in the subject line.\n\nThis policy was last updated August 2026.",
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
          We take your family's privacy seriously. Here's exactly what we collect, how we use it, and your privacy choices.
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
