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
          A plain-English guide for parents: exactly what we collect, how we use it, and your rights as a parent.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
          {[
            {
              title: "What We Collect",
              body: "To create your child's storybook we collect:\n\n• One or two photos of your child (provided by you, deleted after generation — see below)\n• Your child's first name and approximate age (used only to personalise the story text)\n• An adventure theme you choose\n\nWe do not collect your child's surname, date of birth, school, address, or any other identifying information. We do not collect data directly from children — everything goes through you, the parent or guardian.",
            },
            {
              title: "How Photos Are Processed",
              body: "Your photos are sent from your device to our secure servers over an encrypted HTTPS connection. Before processing, we automatically strip all EXIF metadata from the image (including any GPS location data your phone may have embedded).\n\nThe photo is then sent to fal.ai — an AI image service operating under EU Standard Contractual Clauses — where your child's likeness is read directly from the photo at the moment each illustration is generated. No separate 'model' or copy of your child is trained or created; the photo is used only as a live reference for the pictures in your book.",
            },
            {
              title: "How Long Photos Are Kept",
              body: "We never store your child's photo on our own servers. It is passed to fal.ai purely as a live reference while your book's illustrations are generated, and fal.ai automatically and permanently deletes it within 48 hours of upload — most books are finished within minutes.\n\nBecause no per-child model is ever created, there is nothing trained or saved from which a likeness could be recovered later.",
            },
            {
              title: "Who Has Access",
              body: "Your child's photo is seen only by:\n\n• Our automated processing pipeline (no human ever views individual photos)\n• fal.ai's secure infrastructure (subject to their Data Processing Agreement)\n\nWe do not share photos or story data with advertisers, data brokers, analytics services, or any other third party. Stripe (our payment processor) never receives photo or story data — they handle only payment information.",
            },
            {
              title: "Photos Are Never Used to Train AI Models",
              body: "Your child's photos are never used to train, fine-tune, or improve any AI model — ours or anyone else's. The photo serves only as a live reference while your book's illustrations are generated, and is not retained by us afterwards. We have confirmed this policy with fal.ai contractually.",
            },
            {
              title: "AI Provider Data Retention",
              body: "• fal.ai (image generation): reference photos are set to auto-delete from fal.ai within 48 hours of upload, and outputs are not used for model training. Full policy: fal.ai/privacy\n• Anthropic Claude (story text): story prompts are processed in real time and are not stored by Anthropic for training per their API data usage policy (no-training applies to all API customers by default). Full policy: anthropic.com/privacy\n• Stripe (payments): card and payment data is handled entirely by Stripe and never touches our servers. Full policy: stripe.com/privacy",
            },
            {
              title: "Your Rights as a Parent",
              body: "As a parent or guardian, you can:\n\n• Review the personal information we have collected about your child\n• Request that we delete it\n• Refuse to allow any further use or collection of your child's information\n• Ask us to correct inaccurate information\n\nThese rights are provided under the U.S. Children's Online Privacy Protection Act (COPPA) and, depending on your state, laws such as the California Consumer Privacy Act (CCPA/CPRA).\n\nTo exercise any of these rights, email hello@mytinytales.studio with the subject line: Privacy Request. We will verify your request and respond within 45 days.",
            },
            {
              title: "Contact & Complaints",
              body: "My Tiny Tales · hello@mytinytales.studio\n\nIf you have a concern about how we handle your child's data, please contact us first so we can put it right. You may also contact the U.S. Federal Trade Commission (ftc.gov), which enforces COPPA, or your state Attorney General.\n\nLast updated: August 2026.",
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
