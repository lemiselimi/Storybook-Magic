"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const GOLD         = "#f4c430";
const GOLD_LIGHT   = "#ffd700";
const PURPLE_DARK  = "#1a0a2e";
const PURPLE_MID   = "#2d1b4e";
const PURPLE_ACCENT = "#6b3fa0";
const CREAM        = "#fffef7";
const CREAM2       = "#fdf6e8";
const WARM_BROWN   = "#3d2b1f";

const STEPS = [
  { num: "01", icon: "📸", title: "Upload a Photo",       desc: "One clear photo is all we need. Our AI reads your child's features to create their unique cinematic 3D-style character." },
  { num: "02", icon: "✨", title: "Personalise the Story", desc: "Enter their name, age, and choose an adventure theme. AI writes a story crafted just for them." },
  { num: "03", icon: "✨", title: "Preview Free",          desc: "See the first 2 pages of your book completely free. Love it? Unlock all 6 pages — ready in under 2 minutes." },
];

const FEATURES = [
  { icon: "❤️", title: "A story tailored to your child",        desc: "Every word is written for their age, personality, and chosen adventure. No two books are ever the same." },
  { icon: "🧒", title: "Your child sees themselves as the hero — and believes it", desc: "Our AI captures their real face and places them at the centre of every scene, in cinematic detail." },
  { icon: "📖", title: "A bedtime ritual they'll ask for every night", desc: "When a child is the hero, they want to hear the story again and again. It becomes part of your family." },
  { icon: "🎁", title: "From photo to finished book before bedtime", desc: "No waiting weeks. Upload a photo and you'll have a beautifully illustrated 6-page book in under 2 minutes." },
];

const OUTCOMES = [
  { icon: "✨", text: "Your child feels like the hero of their own story" },
  { icon: "📖", text: "A bedtime ritual they'll ask for every night" },
  { icon: "🎁", text: "The most personal gift you'll ever give" },
];

const EXAMPLES = [
  {
    tag: "The Big Adventure 🌋",
    title: "Lily's Magical Quest",
    page: "Page 2 of 6",
    bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    emoji: "🗺️",
    quote: '"Once upon a time, Lily discovered a glowing map hidden beneath her pillow. It led to a world where only the bravest could go — and Lily was the bravest of all."',
    child: "Lily, age 5",
  },
  {
    tag: "Dragon Tamer 🐉",
    title: "Noah and the Lost Dragon",
    page: "Page 3 of 6",
    bg: "linear-gradient(135deg, #d4a0fc 0%, #8ec5fc 100%)",
    emoji: "🐉",
    quote: '"Deep in the Emerald Mountains, Noah found a small dragon trembling in the cold rain. Everyone else had run away — but Noah knelt down and whispered: \'Don\'t be afraid.\'"',
    child: "Noah, age 7",
  },
  {
    tag: "To The Stars 🚀",
    title: "Zara Saves the Universe",
    page: "Page 4 of 6",
    bg: "linear-gradient(135deg, #a1c4fd 0%, #1e1b4e 100%)",
    emoji: "🌌",
    quote: '"The warning alarm rang across Galaxy 7 — the stars were going dark, one by one. Mission Control had one last hope. Zara buckled her helmet and smiled. \'I\'ve got this.\'"',
    child: "Zara, age 9",
  },
];

const REVIEWS = [
  { name: "Sarah M.",  role: "Mum of Emma, age 5",     initials: "SM", color: "#e8b4d0", text: "My daughter screamed with joy when she saw herself as the hero! We've read it together every single night for a week. The most personal gift I've ever given her — worth every penny." },
  { name: "James T.",  role: "Dad of Oliver & Finn",   initials: "JT", color: "#b4c8e8", text: "Ordered on a Tuesday afternoon. By dinner my son had a personalised storybook with HIM as the hero, fighting dragons in a magical forest. The illustrations are stunning. He's completely obsessed." },
  { name: "Priya K.",  role: "Grandmother of Aisha",   initials: "PK", color: "#c8b4e8", text: "I'm not very tech-savvy but this was so easy. Uploaded a photo, chose a theme, and 2 minutes later had a beautiful illustrated book. I'm ordering copies for every grandchild for Christmas!" },
];

const DIGITAL_FEATURES = ["6 unique cinematic 3D-illustrated pages", "Personalised story tailored to their age", "PDF download (print at home)", "Shareable link for family", "Ready in under 2 minutes"];
const PRINT_FEATURES   = ["Everything in Digital", "Premium hardcover book", "Lay-flat binding", "Ships within 5–7 days", "Gift wrapping available"];

export default function LandingPage() {
  const [scrolled,    setScrolled]    = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const [exampleIdx,  setExampleIdx]  = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onScroll(); onResize();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); };
  }, []);

  const ex = EXAMPLES[exampleIdx];

  return (
    <div style={{ fontFamily: "var(--font-inter, 'Segoe UI', system-ui, sans-serif)", color: WARM_BROWN, overflowX: "hidden" }}>
      <style>{`
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sparkle { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes slideEx { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        .cta-btn:hover  { transform:translateY(-2px);box-shadow:0 12px 40px rgba(244,196,48,0.45)!important; }
        .cta-btn        { transition:transform 0.2s,box-shadow 0.2s; }
        .feature-card:hover { transform:translateY(-4px);box-shadow:0 16px 40px rgba(26,10,46,0.12)!important; }
        .feature-card   { transition:transform 0.25s,box-shadow 0.25s; }
        .review-card:hover  { transform:translateY(-3px); }
        .review-card    { transition:transform 0.2s; }
        .pricing-card:hover { transform:translateY(-4px); }
        .pricing-card   { transition:transform 0.25s; }
        .ex-nav:hover   { background:rgba(255,255,255,0.15)!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? "14px 20px" : "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(255,254,247,0.97)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", boxShadow: scrolled ? "0 2px 20px rgba(26,10,46,0.08)" : "none", transition: "all 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>✨</span>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: isMobile ? 16 : 20, color: scrolled ? PURPLE_DARK : "white", transition: "color 0.3s" }}>My Tiny Tales</span>
        </div>
        <Link href="/create" style={{ textDecoration: "none" }}>
          <button className="cta-btn" style={{ padding: isMobile ? "8px 16px" : "10px 24px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: isMobile ? 12 : 14, cursor: "pointer", boxShadow: "0 4px 20px rgba(244,196,48,0.35)" }}>
            Preview Your Book Free →
          </button>
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${PURPLE_DARK} 0%, ${PURPLE_MID} 50%, #1a2e40 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "100px 24px 60px" : "120px 48px 80px", position: "relative", overflow: "hidden" }}>
        {["10%,20%", "80%,15%", "15%,75%", "85%,70%", "50%,10%", "60%,85%"].map((pos, i) => (
          <div key={i} style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], fontSize: [16,12,20,14,18,10][i], animation: `sparkle ${2 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, opacity: 0.4 }}>✦</div>
        ))}

        <div style={{ maxWidth: 1100, width: "100%", display: "flex", alignItems: "center", gap: isMobile ? 0 : 80, flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ flex: 1, animation: "fadeUp 0.8s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(244,196,48,0.12)", border: "1px solid rgba(244,196,48,0.3)", borderRadius: 50, padding: "6px 16px", marginBottom: 24 }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ color: GOLD, fontSize: 13, fontWeight: 600 }}>AI-Powered Personalised Storybooks</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 34 : 54, fontWeight: 700, lineHeight: 1.15, color: "white", margin: "0 0 20px", letterSpacing: "-0.5px" }}>
              Your Child,{" "}
              <span style={{ background: `linear-gradient(90deg, ${GOLD_LIGHT}, #ffb347, ${GOLD_LIGHT})`, backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 3s ease infinite" }}>
                The Hero
              </span>{" "}
              of Their Own Story
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 19, color: "rgba(255,255,255,0.72)", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 520 }}>
              A unique AI-generated book starring your child — a heartwarming story written just for them, with high-quality animated-style artwork, delivered in minutes.
            </p>

            {/* Emotional outcome statements */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {OUTCOMES.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{o.icon}</span>
                  <span style={{ color: "rgba(255,255,255,0.82)", fontSize: isMobile ? 14 : 15, fontWeight: 500 }}>{o.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/create" style={{ textDecoration: "none" }}>
                <button className="cta-btn" style={{ padding: isMobile ? "14px 28px" : "17px 40px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: isMobile ? 15 : 17, cursor: "pointer", boxShadow: "0 8px 32px rgba(244,196,48,0.4)" }}>
                  Preview Your Book Free →
                </button>
              </Link>
              <button onClick={() => document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: isMobile ? "14px 24px" : "17px 32px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: isMobile ? 14 : 16, cursor: "pointer" }}>
                See Example Books
              </button>
            </div>
            <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginTop: 18 }}>Be one of the first families to try it · No subscription</p>
          </div>

          {/* Book mockup */}
          {!isMobile && (
            <div style={{ flexShrink: 0, animation: "float 4s ease-in-out infinite", animationDelay: "0.5s" }}>
              <div style={{ transform: "perspective(800px) rotateY(-8deg) rotateX(2deg)", transformStyle: "preserve-3d" }}>
                <div style={{ display: "flex", boxShadow: "0 40px 80px rgba(0,0,0,0.6), -8px 0 20px rgba(0,0,0,0.3)", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ width: 210, height: 280, background: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
                    <div style={{ fontSize: 56, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))" }}>🌟</div>
                    <div style={{ background: "rgba(255,255,255,0.4)", borderRadius: 8, padding: "4px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: PURPLE_DARK }}>✨ AI Illustration</span>
                    </div>
                    <div style={{ fontSize: 11, color: PURPLE_DARK, opacity: 0.6, fontStyle: "italic" }}>— 1 —</div>
                  </div>
                  <div style={{ width: 8, background: "linear-gradient(to right, #c4a882, #e8dcc8, #c4a882)", flexShrink: 0 }} />
                  <div style={{ width: 190, height: 280, background: CREAM, padding: "28px 22px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: "#5a3d2b", lineHeight: 1.7, fontStyle: "italic" }}>
                      "Once upon a time, <strong>Emma</strong> discovered a magical map that glowed with golden light..."
                    </div>
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
                      {[88, 72, 80, 60].map((w, i) => <div key={i} style={{ height: 6, borderRadius: 3, background: "#e8dcc8", width: `${w}%` }} />)}
                    </div>
                    <div style={{ textAlign: "center", color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 11, marginTop: 8 }}>— 2 —</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ background: CREAM2, borderTop: "1px solid #e8dcc8", borderBottom: "1px solid #e8dcc8" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "24px 24px" : "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          {[
            { icon: "🎉", value: "Be first", label: "One of the first families" },
            { icon: "⚡", value: "< 2 min",  label: "Preview delivered in" },
            { icon: "🔒", value: "Private",  label: "Photo deleted after use" },
            { icon: "🛡️", value: "30-Day",   label: "Satisfaction guarantee" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: isMobile ? 17 : 20, color: PURPLE_DARK, lineHeight: 1 }}>{t.value}</div>
                <div style={{ fontSize: 12, color: "#8a6d5a", marginTop: 2 }}>{t.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: CREAM, padding: isMobile ? "64px 24px" : "96px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 64 }}>
            <p style={{ color: PURPLE_ACCENT, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Simple & Fast</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 28 : 40, fontWeight: 700, color: PURPLE_DARK, margin: 0, lineHeight: 1.2 }}>How It Works</h2>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 32 : 0, flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            {!isMobile && <div style={{ position: "absolute", top: 36, left: "16%", right: "16%", height: 2, background: `linear-gradient(to right, ${GOLD}, ${PURPLE_ACCENT})`, opacity: 0.25, zIndex: 0 }} />}
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: isMobile ? "0 0 0 20px" : "0 24px", position: "relative", zIndex: 1, display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 0 }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${PURPLE_MID}, ${PURPLE_ACCENT})`, display: "flex", alignItems: "center", justifyContent: "center", margin: isMobile ? "0" : "0 auto 20px", boxShadow: `0 8px 24px rgba(107,63,160,0.3)` }}>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: 18, color: PURPLE_DARK, marginBottom: 8 }}>{s.title}</div>
                  <p style={{ color: "#6b5447", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: isMobile ? 48 : 64 }}>
            <Link href="/create" style={{ textDecoration: "none" }}>
              <button className="cta-btn" style={{ padding: "15px 40px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${PURPLE_MID}, ${PURPLE_ACCENT})`, color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 28px rgba(45,27,78,0.3)" }}>
                Preview Your Book Free →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── EXAMPLE BOOKS ── */}
      <section id="examples" style={{ background: PURPLE_DARK, padding: isMobile ? "64px 24px" : "96px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Real Examples</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 28 : 40, fontWeight: 700, color: "white", margin: "0 0 14px", lineHeight: 1.2 }}>See What Your Book Looks Like</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>Swipe through 3 real example book pages. Every story is unique to your child.</p>
          </div>

          {/* Carousel */}
          <div style={{ position: "relative" }}>
            {/* Book spread */}
            <div key={exampleIdx} style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", display: "flex", flexDirection: isMobile ? "column" : "row", animation: "slideEx 0.3s ease both", minHeight: isMobile ? undefined : 320 }}>
              {/* Illustration side */}
              <div style={{ flex: isMobile ? undefined : "0 0 48%", minHeight: isMobile ? 200 : undefined, background: ex.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32, position: "relative" }}>
                <div style={{ fontSize: 80, filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.2))", animation: "float 4s ease-in-out infinite" }}>{ex.emoji}</div>
                <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(4px)", borderRadius: 10, padding: "4px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: PURPLE_DARK }}>✨ AI Illustration</span>
                </div>
                <div style={{ position: "absolute", top: 12, left: 14, background: "rgba(0,0,0,0.18)", borderRadius: 8, padding: "3px 10px" }}>
                  <span style={{ color: "white", fontSize: 10, fontWeight: 600 }}>{ex.page}</span>
                </div>
                <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", color: PURPLE_DARK, fontFamily: "Georgia, serif", fontSize: 12, opacity: 0.5 }}>— {exampleIdx + 1} —</div>
              </div>

              {/* Spine */}
              {!isMobile && <div style={{ width: 6, background: "linear-gradient(to right, #d4c4a8, #e8dcc8, #d4c4a8)", flexShrink: 0 }} />}

              {/* Text side */}
              <div style={{ flex: 1, padding: isMobile ? "28px 24px" : "40px 36px", background: "#fff8f0", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
                <div>
                  <span style={{ background: `rgba(107,63,160,0.1)`, border: `1px solid rgba(107,63,160,0.2)`, borderRadius: 50, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: PURPLE_ACCENT }}>{ex.tag}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: PURPLE_DARK, margin: 0, lineHeight: 1.3 }}>{ex.title}</h3>
                <p style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 14 : 16, lineHeight: 1.85, color: "#3d2b1f", margin: 0, fontStyle: "italic" }}>{ex.quote}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[85, 70, 60].map((w, i) => <div key={i} style={{ height: 8, borderRadius: 4, background: "#e8dcc8", width: `${w}%` }} />)}
                </div>
                <p style={{ color: "#8a6d5a", fontSize: 12, margin: 0, fontStyle: "italic" }}>— Created for {ex.child}</p>
              </div>
            </div>

            {/* Navigation arrows */}
            <button
              className="ex-nav"
              onClick={() => setExampleIdx((exampleIdx + EXAMPLES.length - 1) % EXAMPLES.length)}
              style={{ position: "absolute", left: isMobile ? -4 : -20, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              aria-label="Previous example"
            >‹</button>
            <button
              className="ex-nav"
              onClick={() => setExampleIdx((exampleIdx + 1) % EXAMPLES.length)}
              style={{ position: "absolute", right: isMobile ? -4 : -20, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
              aria-label="Next example"
            >›</button>
          </div>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            {EXAMPLES.map((_, i) => (
              <button key={i} onClick={() => setExampleIdx(i)} style={{ width: i === exampleIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === exampleIdx ? GOLD : "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", transition: "all 0.25s ease", padding: 0 }} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/create" style={{ textDecoration: "none" }}>
              <button className="cta-btn" style={{ padding: "15px 40px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 28px rgba(244,196,48,0.35)" }}>
                Create a Book Like This →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: CREAM, padding: isMobile ? "64px 24px" : "96px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 44 : 60 }}>
            <p style={{ color: PURPLE_ACCENT, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Why Families Love It</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 28 : 40, fontWeight: 700, color: PURPLE_DARK, margin: "0 0 14px", lineHeight: 1.2 }}>Not Just Any Storybook</h2>
            <p style={{ color: "#8a6d5a", fontSize: 16, margin: 0, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>We've rebuilt what a children's book can be — personal, beautiful, and instant.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{ background: "white", border: "1px solid #ede8dc", borderRadius: 20, padding: "32px 28px", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 4px 20px rgba(26,10,46,0.06)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, rgba(107,63,160,0.08), rgba(244,196,48,0.08))`, border: "1px solid rgba(107,63,160,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 17, fontWeight: 700, color: PURPLE_DARK, margin: "0 0 8px", lineHeight: 1.3 }}>{f.title}</h3>
                  <p style={{ color: "#6b5447", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ background: PURPLE_DARK, padding: isMobile ? "64px 24px" : "96px 48px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 44 : 60 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Simple Pricing</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 28 : 40, fontWeight: 700, color: "white", margin: "0 0 12px", lineHeight: 1.2 }}>One Book, Infinite Memories</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>No subscription. No hidden fees. Pay once, keep forever.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "stretch" }}>
            {/* Digital */}
            <div className="pricing-card" style={{ background: "rgba(255,255,255,0.05)", borderRadius: 24, padding: "36px 32px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column" }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Digital Book</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 48, fontWeight: 700, color: "white", lineHeight: 1 }}>$24</span>
                  <span style={{ fontSize: 20, color: "white", marginTop: 8, fontWeight: 700 }}>.99</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "8px 0 0" }}>One-time · Instant delivery</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {DIGITAL_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(244,196,48,0.12)", border: "1px solid rgba(244,196,48,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: GOLD }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/create" style={{ textDecoration: "none" }}>
                <button className="cta-btn" style={{ width: "100%", padding: "14px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Preview Free, Then Buy →</button>
              </Link>
            </div>

            {/* Print + Digital */}
            <div className="pricing-card" style={{ background: `linear-gradient(145deg, ${PURPLE_MID}, #3d1f6e)`, borderRadius: 24, padding: "36px 32px", boxShadow: "0 16px 48px rgba(0,0,0,0.35)", border: "1px solid rgba(244,196,48,0.2)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${GOLD}, #ffb347)` }} />
              <div style={{ position: "absolute", top: 18, right: 20, background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 50 }}>MOST POPULAR</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Print + Digital</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 48, fontWeight: 700, color: "white", lineHeight: 1 }}>$44</span>
                  <span style={{ fontSize: 20, color: "white", marginTop: 8, fontWeight: 700 }}>.99</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "8px 0 0" }}>One-time · Ships in 5–7 days</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {PRINT_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: i === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.88)" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(244,196,48,0.15)", border: "1px solid rgba(244,196,48,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: GOLD }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/create" style={{ textDecoration: "none" }}>
                <button className="cta-btn" style={{ width: "100%", padding: "14px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 24px rgba(244,196,48,0.35)" }}>Preview Free, Then Buy →</button>
              </Link>
            </div>
          </div>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 24 }}>🛡️ 30-day satisfaction guarantee. If you're not delighted, we'll make it right.</p>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section style={{ background: CREAM, padding: isMobile ? "64px 24px" : "96px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 44 : 60 }}>
            <p style={{ color: PURPLE_ACCENT, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Early Families</p>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 28 : 40, fontWeight: 700, color: PURPLE_DARK, margin: 0, lineHeight: 1.2 }}>What Parents Are Saying</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 20 }}>
            {REVIEWS.map((r, i) => (
              <div key={i} className="review-card" style={{ background: "white", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 24px rgba(26,10,46,0.07)", border: "1px solid #ede8dc" }}>
                <div style={{ color: GOLD, fontSize: 16, marginBottom: 14, letterSpacing: 2 }}>{"★".repeat(5)}</div>
                <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 15, lineHeight: 1.7, color: WARM_BROWN, margin: "0 0 20px", fontStyle: "italic" }}>"{r.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: PURPLE_DARK, flexShrink: 0 }}>{r.initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: PURPLE_DARK }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#8a6d5a" }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: `linear-gradient(135deg, ${PURPLE_DARK} 0%, ${PURPLE_MID} 60%, #2a1a50 100%)`, padding: isMobile ? "72px 24px" : "104px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {["15%,20%", "80%,30%", "40%,80%"].map((pos, i) => (
          <div key={i} style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], fontSize: [24,16,20][i], animation: `sparkle ${3 + i}s ease-in-out infinite`, opacity: 0.2 }}>✦</div>
        ))}
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: isMobile ? 40 : 52, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>✨</div>
          <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 700, color: "white", margin: "0 0 16px", lineHeight: 1.2 }}>
            Give Them a Story{" "}
            <span style={{ background: `linear-gradient(90deg, ${GOLD_LIGHT}, #ffb347)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Only They Can Star In
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: isMobile ? 15 : 17, lineHeight: 1.7, margin: "0 0 36px" }}>
            Preview your child's personalised book for free — see the first 2 pages before you spend a penny. From photo to finished story before bedtime.
          </p>
          <Link href="/create" style={{ textDecoration: "none" }}>
            <button className="cta-btn" style={{ padding: isMobile ? "16px 36px" : "18px 52px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: isMobile ? 16 : 18, cursor: "pointer", boxShadow: "0 12px 40px rgba(244,196,48,0.4)" }}>
              Preview Your Book Free →
            </button>
          </Link>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 16 }}>See 2 pages free · No subscription required</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: PURPLE_DARK, borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "36px 24px" : "44px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: 18, color: "white" }}>My Tiny Tales</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Contact Us", "/contact"], ["FAQ", "/faq"]].map(([label, href]) => (
              <a key={label} href={href} style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, textDecoration: "none" }}>{label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} My Tiny Tales. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
