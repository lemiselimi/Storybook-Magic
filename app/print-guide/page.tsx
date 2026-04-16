export default function PrintGuidePage() {
  const steps = [
    {
      num: "01",
      title: "Download your PDF",
      body: "After purchase, your high-resolution PDF will download automatically. Save it somewhere easy to find — your Downloads folder or Desktop.",
    },
    {
      num: "02",
      title: "Check your print settings",
      body: "Open the PDF and set print size to A4 (or US Letter). Choose 'Fit to page' or 'Actual size'. Make sure colour printing is enabled and quality is set to High.",
    },
    {
      num: "03",
      title: "Print at home",
      body: "For best results use a photo-quality inkjet printer with glossy or semi-gloss paper (120gsm+). Standard printer paper works fine for draft copies.",
    },
    {
      num: "04",
      title: "Print at a copy shop",
      body: "Any print shop (Staples, Office Depot, local printer) can print your PDF. Ask for A4 colour double-sided, bound or stapled. Expect to pay $5–$15 depending on options.",
    },
    {
      num: "05",
      title: "Bind your book",
      body: "For a finished look, ask your print shop to spiral-bind or saddle-stitch (staple) the pages. At home, a hole punch and ribbon makes a lovely handmade touch.",
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#0D0820", color: "#EDE8D5", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: "#F5A623" }}>
          Print Guide
        </h1>
        <p style={{ fontSize: 17, color: "#B8A9C9", marginBottom: 56 }}>
          Everything you need to turn your digital storybook into a beautifully printed keepsake.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 28,
                paddingBottom: 40,
                borderLeft: "2px solid rgba(245,166,35,0.3)",
                paddingLeft: 28,
                marginLeft: 20,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -20,
                  top: 0,
                  width: 40,
                  height: 40,
                  background: "#F5A623",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0D0820",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {s.num}
              </div>
              <div style={{ paddingTop: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10, color: "#EDE8D5" }}>
                  {s.title}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.75, color: "#B8A9C9", margin: 0 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            background: "rgba(245,166,35,0.08)",
            border: "1px solid rgba(245,166,35,0.2)",
            borderRadius: 16,
            padding: "28px 32px",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#F5A623" }}>
            Recommended paper
          </h3>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#B8A9C9", margin: 0 }}>
            <strong style={{ color: "#EDE8D5" }}>At home:</strong> Epson Premium Photo Paper Glossy 4×6 or A4 —{" "}
            gives vibrant colours and sharp illustration detail.<br />
            <strong style={{ color: "#EDE8D5" }}>At a print shop:</strong> Ask for 120gsm gloss or silk coated
            paper. Avoid standard 80gsm copier paper — it makes colours look dull.
          </p>
        </div>

        <p style={{ marginTop: 40, fontSize: 14, color: "#6B5A7A", textAlign: "center" }}>
          Need help?{" "}
          <a href="mailto:hello@mytinytales.studio" style={{ color: "#B8A9C9" }}>
            hello@mytinytales.studio
          </a>
        </p>
      </div>
    </main>
  );
}
