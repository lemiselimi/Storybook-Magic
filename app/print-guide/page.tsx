import MarketingNav from "../components/MarketingNav";
import MarketingFooter from "../components/MarketingFooter";

export const metadata = {
  title: "How to Print Your Storybook",
  description: "A simple guide to printing your personalised My Tiny Tales storybook at home, or ordering a premium softcover keepsake.",
  alternates: { canonical: "/print-guide" },
};

export default function PrintGuidePage() {
  const steps = [
    {
      num: "01",
      title: "Download your PDF",
      body: "Once your book is ready, open your book link and choose Download PDF. Save a copy to your device so you can keep it and print it again.",
    },
    {
      num: "02",
      title: "Check your print settings",
      body: "The PDF has square pages, approximately 8.3 × 8.3 inches (210 × 210 mm). For A4 or US Letter paper, choose Fit to printable area to avoid clipping. Keep colour printing on and print one test page first.",
    },
    {
      num: "03",
      title: "Print at home",
      body: "Use paper supported by your printer. For double-sided printing, choose paper coated for printing on both sides. Test two pages first to check their orientation and alignment.",
    },
    {
      num: "04",
      title: "Print at a copy shop",
      body: "Ask your print shop to check the square page size, page order, trimming and binding before printing. Tell them each story passage should face its matching illustration. Request a quote and a proof; prices depend on paper, size and binding.",
    },
    {
      num: "05",
      title: "Bind your book",
      body: "Keep the PDF in its original page order. A print shop can advise on binding and any blank pages its process requires. Avoid booklet mode unless the shop has prepared the file for that binding method.",
    },
  ];

  return (
    <main className="mtt-home" style={{ minHeight: "100vh", background: "#FBF6EC", color: "#26313D", fontFamily: "Georgia, serif" }}>
      <MarketingNav />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: "#26313D" }}>
          Print Guide
        </h1>
        <p style={{ fontSize: 17, color: "#5C6672", marginBottom: 56 }}>
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
                borderLeft: "2px solid rgba(192,134,58,0.3)",
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
                  background: "#C0863A",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2A1D10",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {s.num}
              </div>
              <div style={{ paddingTop: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10, color: "#26313D" }}>
                  {s.title}
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.75, color: "#5C6672", margin: 0 }}>
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            background: "rgba(192,134,58,0.08)",
            border: "1px solid rgba(192,134,58,0.2)",
            borderRadius: 16,
            padding: "28px 32px",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#26313D" }}>
            Recommended paper
          </h3>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#5C6672", margin: 0 }}>
            <strong style={{ color: "#26313D" }}>At home:</strong> Choose a paper size and weight your printer supports. Small photo paper will shrink the text considerably.<br />
            <strong style={{ color: "#26313D" }}>At a print shop:</strong> Ask for 120gsm gloss or silk coated
            paper. Avoid standard 80gsm copier paper — it makes colours look dull.
          </p>
        </div>

        <p style={{ marginTop: 40, fontSize: 14, color: "#6A7078", textAlign: "center" }}>
          Need help?{" "}
          <a href="mailto:hello@mytinytales.studio" style={{ color: "#5C6672" }}>
            hello@mytinytales.studio
          </a>
        </p>
      </div>
      <MarketingFooter />
    </main>
  );
}
