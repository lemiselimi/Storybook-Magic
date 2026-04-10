"use client";
import Link from "next/link";

const PURPLE_DARK  = "#2D1B69";
const PURPLE_MID   = "#4F35A3";
const GOLD         = "#F5A623";
const CREAM        = "#FFF8F0";
const WARM_BROWN   = "#1A1A1A";

export default function PrintGuide() {
  return (
    <div style={{ fontFamily: "var(--font-inter, 'Segoe UI', system-ui, sans-serif)", color: WARM_BROWN, background: CREAM, minHeight: "100vh" }}>
      <style>{`* { box-sizing: border-box; } @media print { .no-print { display: none !important; } }`}</style>

      {/* Nav */}
      <nav className="no-print" style={{ background: PURPLE_DARK, padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>✨</span>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: 18, color: "white" }}>My Tiny Tales</span>
        </Link>
        <Link href="/create" style={{ textDecoration: "none" }}>
          <button style={{ padding: "9px 22px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Create Your Book →
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg, ${PURPLE_DARK} 0%, ${PURPLE_MID} 100%)`, padding: "56px 24px 48px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>🖨️</div>
        <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 700, color: "white", margin: "0 0 14px", lineHeight: 1.2 }}>
          Your Free Print Guide
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 17, maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
          Everything you need to print a beautiful, professional-looking copy of your storybook at home — no special equipment required.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Section 1 */}
        <Section num="01" title="What You'll Need">
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "🖨️", text: "Any home inkjet or laser printer — even a basic £50 model works well" },
              { icon: "📄", text: "A4 or Letter paper (standard 80 gsm works; 120 gsm photo paper looks stunning)" },
              { icon: "💻", text: "Your PDF file downloaded from your My Tiny Tales account" },
              { icon: "📎", text: "Optional: a stapler, hole punch, or ring binder for binding" },
              { icon: "✂️", text: "Optional: scissors or a guillotine if you want to trim edges" },
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 15, lineHeight: 1.6, color: "#4a3a2e" }}>{item.text}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Section 2 */}
        <Section num="02" title="Step-by-Step Printing">
          <ol style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { step: "Open your PDF", detail: 'Open the downloaded PDF in Adobe Acrobat Reader (free) or your browser\'s built-in PDF viewer.' },
              { step: "Go to Print settings", detail: 'Press Ctrl+P (Windows) or Cmd+P (Mac). In the print dialog, select your printer.' },
              { step: "Set paper size", detail: 'Choose A4 (or Letter in the US). Make sure "Fit to page" or "Shrink to fit" is selected so nothing gets cut off.' },
              { step: "Print in colour", detail: 'Ensure colour mode is set to Colour (not greyscale) for the best results. Your printer should detect this automatically.' },
              { step: "Print quality", detail: 'Choose "Best" or "High" quality in your printer settings for vibrant illustrations.' },
              { step: "Print the whole document", detail: 'Print all 11 pages. The pages are already ordered correctly: cover → dedication → 6 story pages → closing → blank back cover.' },
            ].map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${PURPLE_MID}, ${PURPLE_DARK})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: PURPLE_DARK, marginBottom: 3 }}>{item.step}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.65, color: "#5a3d2b" }}>{item.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Section 3 */}
        <Section num="03" title="Tips for the Best Results">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { icon: "🎨", tip: "Use photo paper", detail: "Glossy or matte photo paper (120–200 gsm) makes the illustrations look rich and professional." },
              { icon: "🔲", tip: "Print borderless", detail: "If your printer supports it, enable borderless printing for an edge-to-edge look — especially striking on the cover." },
              { icon: "🌡️", tip: "Let pages dry", detail: "Inkjet prints need a minute or two to dry fully. Stack them loosely rather than face-down right away." },
              { icon: "🔍", tip: "Check alignment", detail: "Print a test page on plain paper first to make sure nothing is cut off before using your photo paper." },
            ].map((item, i) => (
              <div key={i} style={{ background: "white", borderRadius: 16, padding: "20px 18px", border: "1px solid #ede8dc", boxShadow: "0 2px 10px rgba(45,27,105,0.05)" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: PURPLE_DARK, marginBottom: 5 }}>{item.tip}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "#6b5447" }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 4 */}
        <Section num="04" title="Paper Recommendations">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { grade: "Standard", paper: "80 gsm plain paper", result: "Good — text is crisp, illustrations are vibrant", cost: "Cheapest option" },
              { grade: "Better", paper: "120 gsm matte photo paper", result: "Great — richer colours, feels more like a real book", cost: "Widely available" },
              { grade: "Best", paper: "180–200 gsm glossy photo paper", result: "Professional — stunning illustrations, durable pages", cost: "Most expensive, worth it for gifts" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "white", borderRadius: 14, padding: "16px 20px", border: "1px solid #ede8dc" }}>
                <div style={{ minWidth: 70, fontWeight: 700, fontSize: 13, color: GOLD, background: "rgba(245,166,35,0.1)", borderRadius: 8, padding: "4px 10px", textAlign: "center" }}>{row.grade}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: PURPLE_DARK }}>{row.paper}</div>
                  <div style={{ fontSize: 13, color: "#6b5447", marginTop: 2 }}>{row.result}</div>
                  <div style={{ fontSize: 12, color: "#9a8070", marginTop: 2, fontStyle: "italic" }}>{row.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Section 5 */}
        <Section num="05" title="Binding Ideas">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 15, color: "#5a3d2b", margin: 0, lineHeight: 1.7 }}>
              Once printed, here are some lovely ways to turn your pages into a proper book:
            </p>
            {[
              { icon: "📎", idea: "Saddle stitch (staple)", how: "Fold all pages together and staple twice through the spine. Clean, simple, and looks great for thinner stacks." },
              { icon: "🔗", idea: "Ring binder", how: "Punch 2–3 holes and use a small ring binder. Easy to open flat and perfect for little hands." },
              { icon: "🎀", idea: "Ribbon binding", how: "Punch holes down the spine and thread a ribbon or twine through. Ties into a bow for a beautiful gift presentation." },
              { icon: "🏪", idea: "Local print shop", how: "Take your PDF to Staples, FedEx, or a local copy shop. Ask for comb binding or thermal binding for a professional finish for around $5–10." },
              { icon: "📚", idea: "Laminate the cover", how: "Run just the cover page through a home laminator for extra durability. Most laminating pouches are a few pence each." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: PURPLE_DARK, marginBottom: 3 }}>{item.idea}</div>
                  <div style={{ fontSize: 14, color: "#5a3d2b", lineHeight: 1.6 }}>{item.how}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="no-print" style={{ textAlign: "center", marginTop: 48, background: `linear-gradient(135deg, ${PURPLE_DARK}, ${PURPLE_MID})`, borderRadius: 24, padding: "40px 32px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 26, fontWeight: 700, color: "white", margin: "0 0 10px" }}>Ready to create your book?</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, margin: "0 0 24px" }}>Preview 2 pages free — no commitment required.</p>
          <Link href="/create" style={{ textDecoration: "none" }}>
            <button style={{ padding: "15px 40px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Preview Your Book Free →
            </button>
          </Link>
        </div>

      </div>

      {/* Footer */}
      <footer className="no-print" style={{ background: PURPLE_DARK, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "36px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: 16, color: "white" }}>My Tiny Tales</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} My Tiny Tales. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${PURPLE_MID}, ${PURPLE_DARK})`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{num}</div>
        <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, color: PURPLE_DARK, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}
