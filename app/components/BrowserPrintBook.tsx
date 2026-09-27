import { buildInteriorPagePlan, controlledCoverSubtitle, displayName } from "../../lib/book-layout.js";

type Story = { title: string; dedication?: string; pages: { pageNum: number; text: string }[] };

// Browser printing and fulfilment share the same physical page plan.
export default function BrowserPrintBook({ story, childName, coverImage, images }: {
  story: Story; childName: string; coverImage?: string | null; images: (string | null)[];
}) {
  const name = displayName(childName);
  const plan = buildInteriorPagePlan({ sceneCount: story.pages.length });
  return <div id="print-book-root">
    {plan.map((entry, index) => {
      const scene = entry.sceneIndex ?? 0;
      const title = entry.type === "title" || entry.type === "back_cover" ? story.title
        : entry.type === "dedication" ? "For you"
        : entry.type === "belongs" ? `This book belongs to ${name}` : "The End";
      const copy = entry.type === "dedication" ? story.dedication || `For ${name}, with love.`
        : entry.type === "belongs" ? "A little adventure to read together, again and again."
        : entry.type === "ending" ? `Made with love for ${name}.`
        : entry.type === "back_cover" ? `A little adventure starring ${name}. A story to share, and a book to keep.` : "A My Tiny Tales story";
      return <div key={index} className="print-page" data-page-type={entry.type} style={{ background: "#f9f5eb", color: "#1f2a28", fontFamily: "Georgia, serif" }}>
        {entry.type === "front_cover" ? <>
          {coverImage && <img src={coverImage} alt="Cover illustration" style={{ width: "100%", height: "100%", objectFit: "contain" }} />}
          <div style={{ position: "absolute", bottom: 0, width: "100%", padding: "9mm 19mm", background: "#f9f5eb" }}>
            <p style={{ font: "bold 10pt sans-serif", letterSpacing: ".1em", margin: "0 0 4mm" }}>MY TINY TALES</p>
            <h1 style={{ fontSize: "28pt", fontWeight: 400, lineHeight: 1.2, margin: "0 0 5mm" }}>{story.title}</h1>
            <p style={{ fontSize: "12pt", color: "#94432e", margin: 0 }}>{controlledCoverSubtitle(name)}</p>
          </div>
        </> : entry.type === "illustration" ? <img src={images[scene] || undefined} alt={`Illustration ${scene + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : entry.type === "story_text" ? <>
            <div style={{ height: "100%", display: "flex", alignItems: "center", padding: "24mm 25mm 30mm 19mm" }}>
              <p style={{ fontSize: "20pt", lineHeight: 1.45, whiteSpace: "pre-line", margin: 0 }}>{story.pages[scene].text}</p>
            </div>
            <span style={{ position: "absolute", bottom: "10mm", left: "19mm", fontSize: "9pt", color: "#94432e" }}>{index}</span>
          </> : entry.type !== "filler" ? <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20mm", textAlign: "center" }}>
            <h2 style={{ fontSize: "28pt", fontWeight: 400, lineHeight: 1.3, margin: "0 0 12mm" }}>{title}</h2>
            <p style={{ fontSize: "15pt", lineHeight: 1.5, fontStyle: "italic", color: "#94432e", margin: 0 }}>{copy}</p>
          </div> : null}
      </div>;
    })}
  </div>;
}
