import Link from "next/link";

export default function ChildrensDataPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0F0B1F", color: "#F5F0E0", fontFamily: "var(--font-inter, sans-serif)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" style={{ color: "#E8C07A", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 40, opacity: 0.8 }}>
          ← Back to home
        </Link>
        <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 42, fontWeight: 600, marginBottom: 8, color: "#F5F0E0", lineHeight: 1.1 }}>
          Children's Data
        </h1>
        <p style={{ fontSize: 15, color: "rgba(245,240,224,0.6)", marginBottom: 56, lineHeight: 1.6 }}>
          A plain-English guide for parents: exactly what we collect, how we use it, and your rights under UK GDPR.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          {[
            {
              title: "What We Collect",
              body: "To create your child's storybook we collect:\n\n• One or two photos of your child (provided by you, deleted after generation — see below)\n• Your child's first name and approximate age (used only to personalise the story text)\n• An adventure theme you choose\n\nWe do not collect your child's surname, date of birth, school, address, or any other identifying information. We do not collect data directly from children — everything goes through you, the parent or guardian.",
            },
            {
              title: "How Photos Are Processed",
              body: "Your photos are sent from your device to our secure UK/EU servers over an encrypted HTTPS connection. Before processing, we automatically strip all EXIF metadata from the image (including any GPS location data your phone may have embedded).\n\nThe photo is then sent to fal.ai — an AI image service operating under EU Standard Contractual Clauses — to train a personalised character model. fal.ai processes the image in a secure, isolated environment and does not use it for any other purpose.",
            },
            {
              title: "How Long Photos Are Kept",
              body: "Your photos are automatically deleted from all systems — including fal.ai's infrastructure — within approximately 30 minutes of your storybook generation completing. We do not retain any copy of your child's photo after this point.\n\nThe personalised character model (which is a mathematical representation, not a recoverable photo) is deleted at the same time. It is not used for any subsequent generation.",
            },
            {
              title: "Who Has Access",
              body: "Your child's photo is seen only by:\n\n• Our automated processing pipeline (no human ever views individual photos)\n• fal.ai's secure infrastructure (subject to their Data Processing Agreement)\n\nWe do not share photos or story data with advertisers, data brokers, analytics services, or any other third party. Stripe (our payment processor) never receives photo or story data — they handle only payment information.",
            },
            {
              title: "Photos Are Never Used to Train AI Models",
              body: "Your child's photos are never used to train, fine-tune, or improve any AI model — ours or anyone else's. The personalised model created during generation is used only for your book and is deleted immediately after. We have confirmed this policy with fal.ai contractually.",
            },
            {
              title: "AI Provider Data Retention",
              body: "• fal.ai (image generation): input images and outputs are deleted within 30 minutes of generation. fal.ai does not retain data for model training. Full policy: fal.ai/privacy\n• Anthropic Claude (story text): story prompts are processed in real time and are not stored by Anthropic for training per their API data usage policy (no-training opt-out applies to all API customers by default). Full policy: anthropic.com/privacy\n• Stripe (payments): card and payment data is handled entirely by Stripe and never touches our servers. Full policy: stripe.com/privacy",
            },
            {
              title: "Your GDPR Rights",
              body: "As a parent or guardian, you have the following rights under UK GDPR:\n\n• Right of access — request a copy of any data we hold about you or your child\n• Right to erasure — ask us to delete all data associated with your account or order\n• Right to rectification — ask us to correct inaccurate data\n• Right to restrict processing — ask us to pause processing while a dispute is resolved\n• Right to object — object to processing based on legitimate interests\n• Right to portability — receive your data in a machine-readable format\n\nTo exercise any of these rights, email hello@mytinytales.studio with the subject line: Data Request. We will respond within 30 days.",
            },
            {
              title: "Contact & Complaints",
              body: "Data controller: My Tiny Tales Ltd · hello@mytinytales.studio\n\nIf you are unhappy with how we handle your data, you have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk or by phone on 0303 123 1113.\n\nLast updated: April 2026.",
            },
          ].map((s, i) => (
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
