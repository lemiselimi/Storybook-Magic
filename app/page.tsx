"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const GOLD         = "#F5A623";   // golden amber — CTA buttons
const GOLD_LIGHT   = "#F5A623";
const PURPLE_DARK  = "#2D1B69";   // deep violet — dark sections / footer
const PURPLE_MID   = "#4F35A3";   // rich violet — primary brand
const PURPLE_ACCENT = "#4F35A3";
const CREAM        = "#FFF8F0";   // warm cream — main background
const CREAM2       = "#FFF8F0";
const WARM_BROWN   = "#1A1A1A";   // near-black — body text on light

const STEPS = [
  { num: "01", icon: "📸", title: "Upload a Photo",       desc: "One clear photo is all we need. Our AI reads your child's features to create their unique cinematic 3D-style character." },
  { num: "02", icon: "✨", title: "Personalise the Story", desc: "Enter their name, age, and choose an adventure theme. AI writes a story crafted just for them." },
  { num: "03", icon: "✨", title: "Preview Free",          desc: "See the first 2 pages of your book completely free. Love it? Unlock all 6 pages and download instantly." },
];

const FEATURES = [
  { icon: "❤️", title: "A story tailored to your child",        desc: "Every word is written for their age, personality, and chosen adventure. No two books are ever the same." },
  { icon: "🧒", title: "Your child sees themselves as the hero — and believes it", desc: "Our AI captures their real face and places them at the centre of every scene, in cinematic detail." },
  { icon: "📖", title: "A bedtime ritual they'll ask for every night", desc: "When a child is the hero, they want to hear the story again and again. It becomes part of your family." },
  { icon: "🎁", title: "From photo to a finished book they'll treasure", desc: "No waiting weeks for a generic product. Upload a photo and you'll have a beautifully illustrated, one-of-a-kind 6-page storybook." },
];

const OUTCOMES = [
  { icon: "✨", text: "Your child feels like the hero of their own story" },
  { icon: "📖", text: "A bedtime ritual they'll ask for every night" },
  { icon: "🎁", text: "The most personal gift you'll ever give" },
];

const EXAMPLES = [
  {
    tag: "To The Stars 🚀",
    title: "Reaching for the Stars",
    caption: "Reaching for the stars — every scene tells your child's story",
    img: "/examples/example-1.jpg",
    quote: '"Once upon a time, Aria gazed up at the night sky and noticed something strange — the stars were going out, one by one. She knew only she could save them."',
    child: "Aria's Story — Age 5",
  },
  {
    tag: "The Big Adventure 🌋",
    title: "Discovery and Adventure",
    caption: "Discovery and adventure — your child as the brave explorer",
    img: "/examples/example-2.jpg",
    quote: '"Deep in the Whispering Woods, Liam found a secret door carved into the oldest oak. He took a deep breath, pushed it open, and stepped into a world of pure magic."',
    child: "Liam's Adventure — Age 4",
  },
  {
    tag: "Dragon Tamer 🐉",
    title: "Magic Around Every Corner",
    caption: "Magic around every corner — cinematic illustrations just for them",
    img: "/examples/example-3.jpg",
    quote: '"The tiny dragon looked up at Sofia with the saddest eyes she had ever seen. She reached out her hand and whispered, \'Don\'t be afraid. I\'m here.\'"',
    child: "Sofia's Story — Age 6",
  },
];

const REVIEWS = [
  { name: "Sarah M.",  role: "Mum of Emma, age 5",     initials: "SM", color: "#e8b4d0", text: "My daughter screamed with joy when she saw herself as the hero! We've read it together every single night for a week. The most personal gift I've ever given her — worth every penny." },
  { name: "James T.",  role: "Dad of Oliver & Finn",   initials: "JT", color: "#b4c8e8", text: "Ordered on a Tuesday afternoon. By dinner my son had a personalised storybook with HIM as the hero, fighting dragons in a magical forest. The illustrations are stunning. He's completely obsessed." },
  { name: "Priya K.",  role: "Grandmother of Aisha",   initials: "PK", color: "#c8b4e8", text: "I'm not very tech-savvy but this was so easy. Uploaded a photo, chose a theme, and by that evening had a beautiful illustrated book. I'm ordering copies for every grandchild for Christmas!" },
];

const DIGITAL_FEATURES = ["6 unique cinematic 3D-illustrated pages", "Personalised story tailored to their age", "Instant digital download", "Shareable link for family", "Print at home on any printer", "Print as many copies as you like", "Free print guide included"];
const PRINT_FEATURES   = ["Everything in Digital", "Premium hardcover book", "Lay-flat binding", "Ships within 5–7 days", "Gift wrapping available"];

// ── Illustrated review avatars ────────────────────────────────────────────────
function AvatarSarah() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="#F0C4A0" />
      {/* Brown hair — top and sides */}
      <ellipse cx="22" cy="14" rx="13" ry="9" fill="#7B4A2A" />
      <ellipse cx="9"  cy="23" rx="4.5" ry="10" fill="#7B4A2A" />
      <ellipse cx="35" cy="23" rx="4.5" ry="10" fill="#7B4A2A" />
      {/* Face */}
      <circle cx="22" cy="25" r="12" fill="#F0C4A0" />
      {/* Eyes */}
      <circle cx="18" cy="23" r="1.8" fill="#3D1F0A" />
      <circle cx="26" cy="23" r="1.8" fill="#3D1F0A" />
      <circle cx="18.7" cy="22.3" r="0.55" fill="white" />
      <circle cx="26.7" cy="22.3" r="0.55" fill="white" />
      {/* Smile */}
      <path d="M 17 28 Q 22 33 27 28" fill="none" stroke="#C07050" strokeWidth="1.8" strokeLinecap="round" />
      {/* Rosy cheeks */}
      <circle cx="15" cy="27" r="2.8" fill="#F0A080" opacity="0.35" />
      <circle cx="29" cy="27" r="2.8" fill="#F0A080" opacity="0.35" />
    </svg>
  );
}

function AvatarJames() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="#C88A5E" />
      {/* Dark short hair — flat-top shape */}
      <path d="M 9 19 Q 9 8 22 8 Q 35 8 35 19 Z" fill="#1A0A05" />
      {/* Sideburns */}
      <rect x="9" y="18" width="4" height="7" rx="2" fill="#1A0A05" />
      <rect x="31" y="18" width="4" height="7" rx="2" fill="#1A0A05" />
      {/* Face */}
      <circle cx="22" cy="25" r="12" fill="#C88A5E" />
      {/* Eyes */}
      <circle cx="18" cy="23" r="1.8" fill="#1A0A05" />
      <circle cx="26" cy="23" r="1.8" fill="#1A0A05" />
      <circle cx="18.7" cy="22.3" r="0.55" fill="white" />
      <circle cx="26.7" cy="22.3" r="0.55" fill="white" />
      {/* Smile */}
      <path d="M 17 28 Q 22 33 27 28" fill="none" stroke="#7A4020" strokeWidth="1.8" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="15" cy="27" r="2.8" fill="#A06030" opacity="0.28" />
      <circle cx="29" cy="27" r="2.8" fill="#A06030" opacity="0.28" />
    </svg>
  );
}

function AvatarPriya() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="#C07840" />
      {/* Dark hair — longer sides */}
      <ellipse cx="22" cy="13" rx="13" ry="8" fill="#140808" />
      <ellipse cx="8"  cy="24" rx="4"   ry="13" fill="#140808" />
      <ellipse cx="36" cy="24" rx="4"   ry="13" fill="#140808" />
      {/* Face */}
      <circle cx="22" cy="25" r="12" fill="#C07840" />
      {/* Eyes */}
      <circle cx="18" cy="23" r="1.8" fill="#140808" />
      <circle cx="26" cy="23" r="1.8" fill="#140808" />
      <circle cx="18.7" cy="22.3" r="0.55" fill="white" />
      <circle cx="26.7" cy="22.3" r="0.55" fill="white" />
      {/* Smile */}
      <path d="M 17 28 Q 22 33 27 28" fill="none" stroke="#8B4020" strokeWidth="1.8" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="15" cy="27" r="2.8" fill="#D06040" opacity="0.28" />
      <circle cx="29" cy="27" r="2.8" fill="#D06040" opacity="0.28" />
      {/* Bindi */}
      <circle cx="22" cy="19.5" r="1" fill="#CC1020" opacity="0.75" />
    </svg>
  );
}

const REVIEW_AVATARS = [<AvatarSarah key="s" />, <AvatarJames key="j" />, <AvatarPriya key="p" />];

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
        .cta-btn:hover  { transform:translateY(-2px);box-shadow:0 12px 40px rgba(245,166,35,0.45)!important; }
        .cta-btn        { transition:transform 0.2s,box-shadow 0.2s; }
        .feature-card:hover { transform:translateY(-4px);box-shadow:0 16px 40px rgba(45,27,105,0.12)!important; }
        .feature-card   { transition:transform 0.25s,box-shadow 0.25s; }
        .review-card:hover  { transform:translateY(-3px); }
        .review-card    { transition:transform 0.2s; }
        .pricing-card:hover { transform:translateY(-4px); }
        .pricing-card   { transition:transform 0.25s; }
        .ex-nav:hover   { background:rgba(255,255,255,0.15)!important; }
        * { box-sizing:border-box; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? "14px 20px" : "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", background: scrolled ? "rgba(255,254,247,0.97)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", boxShadow: scrolled ? "0 2px 20px rgba(45,27,105,0.08)" : "none", transition: "all 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>✨</span>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: isMobile ? 16 : 20, color: scrolled ? PURPLE_DARK : "white", transition: "color 0.3s" }}>My Tiny Tales</span>
        </div>
        <Link href="/create" style={{ textDecoration: "none" }}>
          <button className="cta-btn" style={{ padding: isMobile ? "8px 16px" : "10px 24px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: isMobile ? 12 : 14, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,166,35,0.35)" }}>
            Preview Your Book Free →
          </button>
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${PURPLE_DARK} 0%, ${PURPLE_MID} 50%, #1a1050 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "100px 24px 60px" : "120px 48px 80px", position: "relative", overflow: "hidden" }}>
        {["10%,20%", "80%,15%", "15%,75%", "85%,70%", "50%,10%", "60%,85%"].map((pos, i) => (
          <div key={i} style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], fontSize: [16,12,20,14,18,10][i], animation: `sparkle ${2 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, opacity: 0.4 }}>✦</div>
        ))}

        <div style={{ maxWidth: 1100, width: "100%", display: "flex", alignItems: "center", gap: isMobile ? 0 : 80, flexDirection: isMobile ? "column" : "row" }}>
          <div style={{ flex: 1, animation: "fadeUp 0.8s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 50, padding: "6px 16px", marginBottom: 24 }}>
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
              A unique AI-generated book starring your child — a heartwarming story written just for them, with high-quality cinematic 3D-style illustrations that will be treasured for years.
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
                <button className="cta-btn" style={{ padding: isMobile ? "14px 28px" : "17px 40px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: isMobile ? 15 : 17, cursor: "pointer", boxShadow: "0 8px 32px rgba(245,166,35,0.4)" }}>
                  Preview Your Book Free →
                </button>
              </Link>
              <button onClick={() => document.getElementById("examples")?.scrollIntoView({ behavior: "smooth" })} style={{ padding: isMobile ? "14px 24px" : "17px 32px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: isMobile ? 14 : 16, cursor: "pointer" }}>
                See Example Books
              </button>
            </div>
          </div>

          {/* Book mockup */}
          {!isMobile && (
            <div style={{ flexShrink: 0, animation: "float 4s ease-in-out infinite", animationDelay: "0.5s" }}>
              <img
                src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600"
                alt="Example storybook"
                style={{ width: 320, height: 420, objectFit: "cover", borderRadius: 16, boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.3)", transform: "rotate(-2deg)" }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ background: CREAM2, borderTop: "1px solid #e8dcc8", borderBottom: "1px solid #e8dcc8" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "24px 24px" : "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          {[
            { icon: "⭐", value: "5-Star Rated",    label: "By early families" },
            { icon: "✨", value: "Magical Results", label: "Worth the wait" },
            { icon: "🔒", value: "Private",         label: "Photo deleted after use" },
            { icon: "🛡️", value: "30-Day",          label: "Satisfaction guarantee" },
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
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${PURPLE_MID}, ${PURPLE_ACCENT})`, display: "flex", alignItems: "center", justifyContent: "center", margin: isMobile ? "0" : "0 auto 20px", boxShadow: `0 8px 24px rgba(79,53,163,0.3)` }}>
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
              <button className="cta-btn" style={{ padding: "15px 40px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${PURPLE_MID}, ${PURPLE_ACCENT})`, color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 28px rgba(79,53,163,0.3)" }}>
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
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 }}>Real pages from a real My Tiny Tales book. Every illustration features your child's actual face — not a cartoon, not a filter.</p>
          </div>

          {/* Carousel */}
          <div style={{ position: "relative" }}>
            {/* Book spread */}
            <div key={exampleIdx} style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", display: "flex", flexDirection: isMobile ? "column" : "row", animation: "slideEx 0.3s ease both", minHeight: isMobile ? undefined : 320 }}>
              {/* Illustration side */}
              <div style={{ flex: isMobile ? undefined : "0 0 48%", minHeight: isMobile ? 220 : 320, position: "relative", overflow: "hidden", backgroundColor: "#2D1B69" }}>
                <img
                  src={ex.img}
                  alt={ex.title}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}
                />
              </div>

              {/* Spine */}
              {!isMobile && <div style={{ width: 6, background: "linear-gradient(to right, #d4c4a8, #e8dcc8, #d4c4a8)", flexShrink: 0 }} />}

              {/* Text side */}
              <div style={{ flex: 1, padding: isMobile ? "28px 24px" : "40px 36px", background: "#fff8f0", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
                <div>
                  <span style={{ background: `rgba(79,53,163,0.1)`, border: `1px solid rgba(79,53,163,0.2)`, borderRadius: 50, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: PURPLE_ACCENT }}>{ex.tag}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: PURPLE_DARK, margin: 0, lineHeight: 1.3 }}>{ex.title}</h3>
                <p style={{ color: "#6b5447", fontSize: 12, margin: 0 }}>{ex.caption}</p>
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
              <button className="cta-btn" style={{ padding: "15px 40px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 28px rgba(245,166,35,0.35)" }}>
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
              <div key={i} className="feature-card" style={{ background: "white", border: "1px solid #ede8dc", borderRadius: 20, padding: "32px 28px", display: "flex", gap: 20, alignItems: "flex-start", boxShadow: "0 4px 20px rgba(45,27,105,0.06)" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, rgba(79,53,163,0.08), rgba(245,166,35,0.08))`, border: "1px solid rgba(79,53,163,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>{f.icon}</div>
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
                  <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 48, fontWeight: 700, color: "white", lineHeight: 1 }}>$17</span>
                  <span style={{ fontSize: 20, color: "white", marginTop: 8, fontWeight: 700 }}>.99</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "8px 0 0" }}>One-time · Instant delivery</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {DIGITAL_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.75)" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: GOLD }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/create" style={{ textDecoration: "none" }}>
                <button className="cta-btn" style={{ width: "100%", padding: "14px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "white", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Preview Free, Then Buy →</button>
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11 }}>🔒</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Secure Checkout</span>
                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Stripe</span>
                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>SSL Encrypted</span>
              </div>
            </div>

            {/* Print + Digital — Coming Soon */}
            <div className="pricing-card" style={{ background: `linear-gradient(145deg, ${PURPLE_MID}, #3d1f6e)`, borderRadius: 24, padding: "36px 32px", boxShadow: "0 16px 48px rgba(0,0,0,0.35)", border: "1px solid rgba(245,166,35,0.2)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", opacity: 0.65, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${GOLD}, #ffb347)` }} />
              <div style={{ position: "absolute", top: 18, right: 20, background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 50 }}>🚀 Coming Soon</div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Print + Digital</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 48, fontWeight: 700, color: "white", lineHeight: 1 }}>$37</span>
                  <span style={{ fontSize: 20, color: "white", marginTop: 8, fontWeight: 700 }}>.99</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "8px 0 0" }}>Premium hardcover — launching soon</p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {PRINT_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: i === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.88)" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: GOLD }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button style={{ width: "100%", padding: "14px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>Launching Soon</button>
            </div>
          </div>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: 13, marginTop: 24 }}>🛡️ 30-day happiness promise. We're committed to making sure you love your book.</p>
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
              <div key={i} className="review-card" style={{ background: "white", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 24px rgba(45,27,105,0.07)", border: "1px solid #ede8dc" }}>
                <div style={{ color: GOLD, fontSize: 16, marginBottom: 14, letterSpacing: 2 }}>{"★".repeat(5)}</div>
                <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 15, lineHeight: 1.7, color: WARM_BROWN, margin: "0 0 20px", fontStyle: "italic" }}>"{r.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                    {REVIEW_AVATARS[i]}
                  </div>
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
            Preview your child's personalised book for free — see the first 2 pages before you spend a penny. No subscription, no commitment.
          </p>
          <Link href="/create" style={{ textDecoration: "none" }}>
            <button className="cta-btn" style={{ padding: isMobile ? "16px 36px" : "18px 52px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: isMobile ? 16 : 18, cursor: "pointer", boxShadow: "0 12px 40px rgba(245,166,35,0.4)" }}>
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
            {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Contact Us", "/contact"], ["FAQ", "/faq"], ["Print Guide", "/print-guide"]].map(([label, href]) => (
              <a key={label} href={href} style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, textDecoration: "none" }}>{label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} My Tiny Tales. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
