"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BookMockup3D from "./components/BookMockup3D";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD       = "#E8C07A";
const GOLD_WARM  = "#D4A24C";
const MOON       = "#A78BFA";
const TEXT       = "#F5F0E0";
const MUTED      = "rgba(245,240,224,0.65)";
const BG_BASE    = "#0F0B1F";
const BG_EL      = "#1A1535";
const SURFACE    = "rgba(255,255,255,0.04)";
const SURF_BDR   = "rgba(255,255,255,0.08)";

// ── SVG primitives ────────────────────────────────────────────────────────────
function SparkSVG({ size = 20, color = GOLD, glow = false }: { size?: number; color?: string; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true"
      style={glow ? { filter: `drop-shadow(0 0 6px ${color}80)` } : undefined}>
      <path d="M12 1l2.39 7.61L22 12l-7.61 2.39L12 22l-2.39-7.61L2 12l7.61-2.39z" />
    </svg>
  );
}
function StarSVG({ size = 16, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function CheckSVG({ size = 14, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const EXAMPLES = [
  { tag: "The Big Adventure", title: "A Real Hero", caption: "Your child as the hero — brave, kind, and unforgettable", img: "/examples/example-1.jfif", quote: '"Loki was a real hero! He learned that being brave and kind saves the day. What an amazing adventure!"', child: "Loki, Age 4 — Adventure theme" },
  { tag: "To The Stars",       title: "She Reached the Stars", caption: "Every page packed with heart — your child's real face in every scene", img: "/examples/example-2.jfif", quote: '"Aria blasted off into the cosmos and discovered that the bravest explorers carry kindness in their hearts."', child: "Aria, Age 6 — Space theme" },
  { tag: "Dragon Tamer",       title: "The Dragon Needed Him", caption: "Cinematic Disney-style illustrations made just for them", img: "/examples/example-3.jfif", quote: '"Only Noah had what it took. He walked right up to the great dragon and said: I\'m here to help."', child: "Noah, Age 5 — Dragon theme" },
];

const STEPS = [
  { num: "01", title: "Upload a Photo",        desc: "One clear photo is all we need. Our AI reads your child's features to create a cinematic 3D character that looks just like them." },
  { num: "02", title: "Personalise the Story", desc: "Enter their name, age, and choose an adventure theme. AI writes a story crafted just for them — every word, every scene." },
  { num: "03", title: "Preview Free",           desc: "See the first 2 pages of your book completely free. Love it? Unlock all 6 pages and download instantly." },
];

const DIGITAL_FEATURES = [
  "6 unique cinematic 3D-illustrated pages",
  "Personalised story tailored to their age",
  "Instant digital download",
  "Shareable link for family",
  "Print at home on any printer",
  "Print as many copies as you like",
  "Free print guide included",
];
const PRINT_FEATURES = [
  "Everything in Digital",
  "Premium hardcover book",
  "Lay-flat binding",
  "Ships within 5–7 days",
];

const REVIEWS = [
  { name: "Sarah M.",  role: "Mum of Emma, age 5",    initials: "SM", text: "My daughter screamed with joy when she saw herself as the hero! We've read it together every single night for a week. The most personal gift I've ever given her — worth every penny." },
  { name: "James T.",  role: "Dad of Oliver & Finn",  initials: "JT", text: "Ordered on a Tuesday afternoon. By dinner my son had a personalised storybook with HIM as the hero, fighting dragons in a magical forest. The illustrations are stunning. He's completely obsessed." },
  { name: "Priya K.",  role: "Grandmother of Aisha",  initials: "PK", text: "I'm not very tech-savvy but this was so easy. Uploaded a photo, chose a theme, and by that evening had a beautiful illustrated book. I'm ordering copies for every grandchild for Christmas!" },
];

const FOOTER_LINKS = {
  Product:  [["Examples", "#examples"], ["Pricing", "#pricing"], ["FAQ", "/faq"]],
  Company:  [["About", "/contact"], ["Contact", "/contact"], ["Blog", "/contact"]],
  Legal:    [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "/refunds"], ["Children's Data", "/childrens-data"], ["Cookie Settings", "__cookie__"]],
};

// ── Illustrated avatars ───────────────────────────────────────────────────────
function AvatarSM() {
  return <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="22" fill="#F0C4A0"/><ellipse cx="22" cy="14" rx="13" ry="9" fill="#7B4A2A"/><ellipse cx="9" cy="23" rx="4.5" ry="10" fill="#7B4A2A"/><ellipse cx="35" cy="23" rx="4.5" ry="10" fill="#7B4A2A"/><circle cx="22" cy="25" r="12" fill="#F0C4A0"/><circle cx="18" cy="23" r="1.8" fill="#3D1F0A"/><circle cx="26" cy="23" r="1.8" fill="#3D1F0A"/><circle cx="18.7" cy="22.3" r=".55" fill="white"/><circle cx="26.7" cy="22.3" r=".55" fill="white"/><path d="M17 28 Q22 33 27 28" fill="none" stroke="#C07050" strokeWidth="1.8" strokeLinecap="round"/><circle cx="15" cy="27" r="2.8" fill="#F0A080" opacity=".35"/><circle cx="29" cy="27" r="2.8" fill="#F0A080" opacity=".35"/></svg>;
}
function AvatarJT() {
  return <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="22" fill="#C88A5E"/><path d="M9 19 Q9 8 22 8 Q35 8 35 19 Z" fill="#1A0A05"/><rect x="9" y="18" width="4" height="7" rx="2" fill="#1A0A05"/><rect x="31" y="18" width="4" height="7" rx="2" fill="#1A0A05"/><circle cx="22" cy="25" r="12" fill="#C88A5E"/><circle cx="18" cy="23" r="1.8" fill="#1A0A05"/><circle cx="26" cy="23" r="1.8" fill="#1A0A05"/><circle cx="18.7" cy="22.3" r=".55" fill="white"/><circle cx="26.7" cy="22.3" r=".55" fill="white"/><path d="M17 28 Q22 33 27 28" fill="none" stroke="#7A4020" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function AvatarPK() {
  return <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="22" fill="#C07840"/><ellipse cx="22" cy="13" rx="13" ry="8" fill="#140808"/><ellipse cx="8" cy="24" rx="4" ry="13" fill="#140808"/><ellipse cx="36" cy="24" rx="4" ry="13" fill="#140808"/><circle cx="22" cy="25" r="12" fill="#C07840"/><circle cx="18" cy="23" r="1.8" fill="#140808"/><circle cx="26" cy="23" r="1.8" fill="#140808"/><circle cx="18.7" cy="22.3" r=".55" fill="white"/><circle cx="26.7" cy="22.3" r=".55" fill="white"/><path d="M17 28 Q22 33 27 28" fill="none" stroke="#8B4020" strokeWidth="1.8" strokeLinecap="round"/><circle cx="22" cy="19.5" r="1" fill="#CC1020" opacity=".75"/></svg>;
}
const AVATARS = [<AvatarSM key="s" />, <AvatarJT key="j" />, <AvatarPK key="p" />];

// ── Stripe / payment SVGs ─────────────────────────────────────────────────────
function StripeSVG() {
  return <svg height="18" viewBox="0 0 60 25" aria-label="Stripe" fill="none"><rect width="60" height="25" rx="4" fill="#6772E5" opacity=".12"/><path d="M12 9.5c0-1.1.9-1.5 2.3-1.5 2 0 4.6.6 6.6 1.7V6c-2-.8-4-1-6.6-1C10.5 5 8 7 8 10c0 4.5 6.2 3.8 6.2 5.7 0 1.3-1.1 1.7-2.7 1.7-2.3 0-5.3-.9-7.5-2.2V19c2.5 1 5 1.5 7.5 1.5 3.8 0 6.5-1.8 6.5-5.2C18 10.8 12 11.6 12 9.5z" fill="#6772E5"/></svg>;
}
function VisaSVG() {
  return <svg height="18" viewBox="0 0 60 25" aria-label="Visa" fill="none"><rect width="60" height="25" rx="4" fill="#1A1F71" opacity=".12"/><path d="M24 17H21l2-9h3l-2 9zm-5.5-9l-3 6-.3-1.5L14 9.5s-.3-.5-1.5-.5H8l-.1.3s1.3.3 2.8 1.2l2.7 7h3l4.5-9h-3.4zm17 0h-2.8c-.7 0-1.1.4-1.3 1l-4.2 8h3l.6-1.7h3.6l.4 1.7H38L35.5 8zm-3.5 5.2l1.5-4 .9 4h-2.4zm-10-5.2l-2.8 9h-2.9L25 8h2.9z" fill="#1A1F71"/></svg>;
}
function McSVG() {
  return <svg height="18" viewBox="0 0 60 25" aria-label="Mastercard" fill="none"><rect width="60" height="25" rx="4" fill="#252525" opacity=".08"/><circle cx="24" cy="12.5" r="7" fill="#EB001B" opacity=".9"/><circle cx="36" cy="12.5" r="7" fill="#F79E1B" opacity=".9"/><path d="M30 7.5a7 7 0 010 10 7 7 0 010-10z" fill="#FF5F00" opacity=".9"/></svg>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled,   setScrolled]   = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [exIdx,      setExIdx]      = useState(0);
  const [cursorPos,  setCursorPos]  = useState({ x: -200, y: -200 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    const onResize = () => setIsMobile(window.innerWidth < 768);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const mqHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    onScroll(); onResize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    mq.addEventListener("change", mqHandler);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", mqHandler);
    };
  }, []);

  // Cursor follower (desktop, reduced-motion-off)
  useEffect(() => {
    if (isMobile || reducedMotion) return;
    const fn = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, [isMobile, reducedMotion]);

  // Scroll reveal
  useEffect(() => {
    if (reducedMotion) {
      document.querySelectorAll<HTMLElement>(".reveal").forEach(el => el.classList.add("visible"));
      return;
    }
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [reducedMotion]);

  const ex = EXAMPLES[exIdx];

  const NAV_LINKS = [
    ["Examples",     "#examples"],
    ["How It Works", "#how-it-works"],
    ["Pricing",      "#pricing"],
    ["FAQ",          "/faq"],
  ];

  return (
    <div style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)", color: TEXT, overflowX: "hidden", background: `linear-gradient(180deg, ${BG_BASE} 0%, ${BG_EL} 100%)`, minHeight: "100vh" }}>
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sparkleAni { 0%,100%{opacity:0.25;transform:scale(1)} 50%{opacity:1;transform:scale(1.35)} }
        @keyframes kenBurns   { from{transform:scale(1)} to{transform:scale(1.05)} }
        @keyframes slideEx    { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer    { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes badgeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px) !important; border-color: rgba(255,255,255,0.16) !important; box-shadow: 0 24px 64px rgba(0,0,0,0.4) !important; }
        .nav-link { color: rgba(245,240,224,0.65); font-size: 14px; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #F5F0E0; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Cursor follower ── */}
      {!isMobile && !reducedMotion && (
        <div aria-hidden="true" style={{ position: "fixed", left: cursorPos.x - 8, top: cursorPos.y - 8, width: 16, height: 16, borderRadius: "50%", background: `rgba(232,192,122,0.35)`, filter: "blur(3px)", pointerEvents: "none", zIndex: 9998, transition: "left 0.07s, top 0.07s", mixBlendMode: "screen" }} />
      )}

      {/* ════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════ */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 64, display: "flex", alignItems: "center", padding: isMobile ? "0 20px" : "0 48px", justifyContent: "space-between", background: scrolled ? "rgba(15,11,31,0.88)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <SparkSVG size={22} color={GOLD} glow />
          <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontWeight: 600, fontSize: isMobile ? 16 : 19, color: TEXT, letterSpacing: "-0.3px" }}>My Tiny Tales</span>
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {NAV_LINKS.map(([label, href]) => (
              <a key={label} href={href} className="nav-link">{label}</a>
            ))}
          </nav>
        )}

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!isMobile && (
            <a href="#" className="nav-link" style={{ padding: "8px 14px", border: "1px solid rgba(245,240,224,0.18)", borderRadius: 8 }}>Sign in</a>
          )}
          <Link href="/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, padding: isMobile ? "8px 16px" : "10px 20px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: isMobile ? 12 : 14, boxShadow: "0 4px 16px rgba(232,192,122,0.25)", transition: "box-shadow 0.2s, transform 0.2s", whiteSpace: "nowrap" }}>
            Create your book <span style={{ display: "inline-block", transition: "transform 0.2s" }}>→</span>
          </Link>

          {/* Hamburger */}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" style={{ background: "transparent", border: "none", color: TEXT, fontSize: 22, cursor: "pointer", padding: 4 }}>
              {menuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(15,11,31,0.98)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
          {NAV_LINKS.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 28, fontWeight: 600, color: TEXT, textDecoration: "none" }}>{label}</a>
          ))}
          <Link href="/create" onClick={() => setMenuOpen(false)} style={{ marginTop: 16, padding: "14px 36px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: 17, textDecoration: "none" }}>Create your book →</Link>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "100px 24px 64px" : "120px 48px 80px", position: "relative", overflow: "hidden" }}>
        {/* Aurora blobs */}
        <div aria-hidden="true" style={{ position: "absolute", top: "-25%", left: "-15%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(100,70,200,0.4) 0%, transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
        <div aria-hidden="true" style={{ position: "absolute", bottom: "-25%", right: "-15%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,40,160,0.28) 0%, transparent 70%)", filter: "blur(120px)", pointerEvents: "none" }} />

        {/* Gold SVG sparkles with glow */}
        {(["10%,15%", "85%,10%", "90%,75%", "6%,80%"] as const).map((pos, i) => (
          <div key={i} aria-hidden="true" style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], animation: `sparkleAni ${2.8 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.5}s`, pointerEvents: "none" }}>
            <SparkSVG size={[18, 12, 22, 14][i]} color={GOLD} glow />
          </div>
        ))}

        <div style={{ maxWidth: 1200, width: "100%", display: "flex", alignItems: "center", gap: isMobile ? 0 : 72, flexDirection: isMobile ? "column" : "row" }}>
          {/* Left content */}
          <div style={{ flex: 1, animation: "fadeUp 0.9s ease both" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(232,192,122,0.08)", border: "1px solid rgba(232,192,122,0.22)", borderRadius: 50, padding: "6px 16px", marginBottom: 28 }}>
              <SparkSVG size={13} color={GOLD} />
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em" }}>AI-Powered Personalised Storybooks</span>
            </div>

            {/* H1 */}
            <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 36 : 58, fontWeight: 600, lineHeight: 1.12, color: TEXT, margin: "0 0 22px", letterSpacing: "-0.8px" }}>
              Your Child,{" "}
              <span style={{ position: "relative", display: "inline-block" }}>
                The Hero
                <svg aria-hidden="true" style={{ position: "absolute", bottom: -10, left: -4, width: "calc(100% + 8px)", height: 14 }} viewBox="0 0 200 14" preserveAspectRatio="none">
                  <path d="M3 10 C35 3, 75 14, 115 7 C155 0, 182 12, 197 8" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>{" "}
              of Their Own Story
            </h1>

            <p style={{ fontSize: isMobile ? 16 : 19, color: MUTED, lineHeight: 1.7, margin: "0 0 30px", maxWidth: 530 }}>
              A unique AI-generated book starring your child — a heartwarming story written just for them, with cinematic 3D-style illustrations treasured for years.
            </p>

            {/* Bullet list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
              {[
                "Your child feels like the hero of their own story",
                "A bedtime ritual they'll ask for every night",
                "The most personal gift you'll ever give",
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(232,192,122,0.1)", border: "1px solid rgba(232,192,122,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckSVG size={11} color={GOLD} /></span>
                  <span style={{ color: "rgba(245,240,224,0.85)", fontSize: isMobile ? 14 : 15, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: isMobile ? "15px 28px" : "17px 40px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: isMobile ? 15 : 17, boxShadow: "0 8px 32px rgba(232,192,122,0.25), inset 0 1px 0 rgba(255,255,255,0.3)", transition: "transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(232,192,122,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,192,122,0.25), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
              >
                Try Free — No Card Needed <span>→</span>
              </Link>
              <a href="#examples" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: isMobile ? "15px 24px" : "17px 32px", borderRadius: 50, border: "1px solid rgba(245,240,224,0.28)", background: "transparent", color: "rgba(245,240,224,0.85)", fontWeight: 600, fontSize: isMobile ? 14 : 16, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(245,240,224,0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                See Example Books
              </a>
            </div>

            {/* Trust row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {[0,1,2,3,4].map(i => <StarSVG key={i} size={14} color={GOLD} />)}
                <span style={{ color: MUTED, fontSize: 13, marginLeft: 6 }}>Rated by our launch families</span>
              </div>
              <span style={{ width: 1, height: 16, background: "rgba(245,240,224,0.15)" }} />
              <span style={{ color: MUTED, fontSize: 13 }}>Free preview</span>
              <span style={{ width: 1, height: 16, background: "rgba(245,240,224,0.15)" }} />
              <span style={{ color: MUTED, fontSize: 13 }}>No subscription</span>
            </div>
          </div>

          {/* Right — book card with Ken Burns + floating badges */}
          {!isMobile && (
            <div style={{ flexShrink: 0, position: "relative", animation: "fadeUp 1s ease 0.3s both" }}>
              {/* Glow */}
              <div aria-hidden="true" style={{ position: "absolute", inset: -40, borderRadius: 40, background: `radial-gradient(ellipse, rgba(232,192,122,0.18) 0%, transparent 70%)`, filter: "blur(28px)", pointerEvents: "none" }} />
              <div style={{ width: 340, height: 440, borderRadius: 20, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)", position: "relative" }}>
                <img src="/examples/example-1.jfif" alt="Sample storybook page" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", animation: reducedMotion ? "none" : "kenBurns 20s ease-in-out infinite alternate", display: "block" }} />
              </div>
              {/* Floating badge — bottom left */}
              <div style={{ position: "absolute", bottom: 30, left: -32, background: SURFACE, backdropFilter: "blur(16px)", border: `1px solid ${SURF_BDR}`, borderRadius: 14, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, animation: `badgeFloat 4s ease-in-out infinite`, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
                <StarSVG size={14} color={GOLD} />
                <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, whiteSpace: "nowrap" }}>6 unique pages</span>
              </div>
              {/* Floating badge — top right */}
              <div style={{ position: "absolute", top: 22, right: -28, background: SURFACE, backdropFilter: "blur(16px)", border: `1px solid ${SURF_BDR}`, borderRadius: 14, padding: "8px 14px", animation: `badgeFloat 4.5s ease-in-out 0.8s infinite`, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, whiteSpace: "nowrap" }}>Disney-style art ✦</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TRUST BAR
      ════════════════════════════════════════════════════ */}
      <section style={{ borderTop: `1px solid ${SURF_BDR}`, borderBottom: `1px solid ${SURF_BDR}`, background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "22px 24px" : "22px 48px", display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          {[
            { icon: "⭐", value: "5-Star Rated",    label: "Launch families, Aug–Nov 2025" },
            { icon: "⚡", value: "Ready in 5 min",  label: "From photo to preview" },
            { icon: "🔒", value: "Never Stored",    label: "Photos deleted after use" },
            { icon: "🛡️", value: "No Subscription", label: "Pay once, keep forever" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontWeight: 600, fontSize: isMobile ? 16 : 19, color: TEXT, lineHeight: 1 }}>{t.value}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{t.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: isMobile ? "72px 24px" : "104px 48px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: isMobile ? 52 : 72 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 14px" }}>Simple &amp; Fast</p>
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.15, letterSpacing: "-0.5px" }}>How It Works</h2>
          </div>

          <div style={{ display: "flex", gap: isMobile ? 40 : 0, flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            {/* Dotted connecting line */}
            {!isMobile && (
              <div aria-hidden="true" style={{ position: "absolute", top: 52, left: "16%", right: "16%", height: 0, borderTop: `2px dashed rgba(232,192,122,0.28)`, zIndex: 0 }} />
            )}

            {STEPS.map((s, i) => (
              <div key={i} className="reveal" style={{ flex: 1, textAlign: "center", padding: isMobile ? "0 0 0 16px" : "0 28px", position: "relative", zIndex: 1, display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 18 : 0, animationDelay: `${i * 0.15}s` }}>
                {/* Giant numeral */}
                <div aria-hidden="true" style={{ position: isMobile ? "static" : "absolute", top: -16, left: "50%", transform: isMobile ? "none" : "translateX(-50%)", fontSize: isMobile ? 56 : 120, fontWeight: 700, fontFamily: "var(--font-fraunces, Georgia, serif)", color: GOLD, opacity: 0.08, lineHeight: 1, pointerEvents: "none", userSelect: "none", flexShrink: 0, width: isMobile ? 64 : undefined, textAlign: "center" }}>{s.num}</div>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 76, height: 76, borderRadius: "50%", background: SURFACE, border: `1.5px solid ${SURF_BDR}`, backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", margin: isMobile ? "0" : "0 auto 22px", boxShadow: `0 0 0 1px rgba(232,192,122,0.1), 0 12px 32px rgba(0,0,0,0.3)` }}>
                    <SparkSVG size={28} color={GOLD} glow />
                  </div>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "center" }}>
                  <div style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontWeight: 600, fontSize: isMobile ? 17 : 19, color: TEXT, marginBottom: 10 }}>{s.title}</div>
                  <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ textAlign: "center", marginTop: isMobile ? 52 : 72 }}>
            <Link href="/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 40px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: 16, boxShadow: "0 8px 32px rgba(232,192,122,0.22)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = ""}
            >
              Try Free — No Card Needed →
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          EXAMPLES
      ════════════════════════════════════════════════════ */}
      <section id="examples" style={{ padding: isMobile ? "72px 24px" : "104px 48px", borderTop: `1px solid ${SURF_BDR}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: isMobile ? 44 : 60 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 14px" }}>Real Examples</p>
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>See What Your Book Looks Like</h2>
            <p style={{ color: MUTED, fontSize: 15, margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>Real pages from a My Tiny Tales book. Every illustration features your child's actual face.</p>
          </div>

          <div style={{ position: "relative" }}>
            <div key={exIdx} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${SURF_BDR}`, backdropFilter: "blur(16px)", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: isMobile ? "column" : "row", animation: "slideEx 0.3s ease both", minHeight: isMobile ? undefined : 320, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
              <div style={{ flex: isMobile ? undefined : "0 0 48%", minHeight: isMobile ? 220 : 320, position: "relative", overflow: "hidden" }}>
                <img src={ex.img} alt={ex.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
              </div>
              {!isMobile && <div style={{ width: 4, background: `linear-gradient(to right, rgba(232,192,122,0.12), rgba(232,192,122,0.04), transparent)`, flexShrink: 0 }} />}
              <div style={{ flex: 1, padding: isMobile ? "28px 24px" : "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
                <span style={{ background: `rgba(232,192,122,0.08)`, border: `1px solid rgba(232,192,122,0.2)`, borderRadius: 50, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: GOLD, display: "inline-block", width: "fit-content" }}>{ex.tag}</span>
                <h3 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 18 : 22, fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.3 }}>{ex.title}</h3>
                <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{ex.caption}</p>
                <p style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 14 : 16, lineHeight: 1.85, color: TEXT, margin: 0, fontStyle: "italic" }}>{ex.quote}</p>
                <p style={{ color: "rgba(245,240,224,0.35)", fontSize: 12, margin: 0, fontStyle: "italic" }}>— Created for {ex.child}</p>
              </div>
            </div>

            {/* Circular frosted arrow buttons */}
            {[
              { dir: -1, side: "left", label: "Previous example" },
              { dir:  1, side: "right", label: "Next example" },
            ].map(({ dir, side, label }) => (
              <button key={side} onClick={() => setExIdx((exIdx + EXAMPLES.length + dir) % EXAMPLES.length)} aria-label={label} style={{ position: "absolute", [side]: isMobile ? -4 : -26, top: "50%", transform: "translateY(-50%)", width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)", border: `1px solid rgba(255,255,255,0.14)`, color: TEXT, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s, border-color 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              >
                {dir === -1 ? "‹" : "›"}
              </button>
            ))}
          </div>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            {EXAMPLES.map((_, i) => (
              <button key={i} onClick={() => setExIdx(i)} aria-label={`Example ${i + 1}`} style={{ width: i === exIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === exIdx ? GOLD : "rgba(245,240,224,0.18)", border: "none", cursor: "pointer", transition: "all 0.25s ease", padding: 0 }} />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 44 }}>
            <Link href="/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 40px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: 16, boxShadow: "0 8px 32px rgba(232,192,122,0.22)" }}>
              Try Free — No Card Needed →
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: isMobile ? "72px 24px" : "104px 48px", borderTop: `1px solid ${SURF_BDR}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: isMobile ? 44 : 64 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 14px" }}>Simple Pricing</p>
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: "0 0 12px", letterSpacing: "-0.5px" }}>One Book, Infinite Memories</h2>
            <p style={{ color: MUTED, fontSize: 15, margin: 0 }}>No subscription. No hidden fees. Pay once, keep forever.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "end" }}>
            {/* Digital */}
            <div className="card-hover reveal" style={{ background: SURFACE, backdropFilter: "blur(20px)", border: `1px solid ${SURF_BDR}`, borderRadius: 24, padding: "36px 32px", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Digital Book</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 2, marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 20, fontWeight: 600, color: GOLD, lineHeight: 1, marginTop: 10 }}>$</span>
                <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 52, fontWeight: 600, color: TEXT, lineHeight: 1 }}>17</span>
                <span style={{ fontSize: 22, color: MUTED, marginTop: 14, fontWeight: 600 }}>.99</span>
              </div>
              <p style={{ color: "rgba(245,240,224,0.38)", fontSize: 13, margin: "0 0 24px" }}>One-time · Instant delivery</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {DIGITAL_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: MUTED }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,192,122,0.08)", border: "1px solid rgba(232,192,122,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckSVG size={11} color={GOLD} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/create" style={{ textDecoration: "none", display: "block", width: "100%", padding: "13px", borderRadius: 50, border: "1px solid rgba(245,240,224,0.25)", textAlign: "center", color: TEXT, fontWeight: 700, fontSize: 15, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(245,240,224,0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                Try Free — No Card Needed →
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
                <StripeSVG /><VisaSVG /><McSVG />
                <span style={{ color: "rgba(245,240,224,0.25)", fontSize: 11 }}>SSL Encrypted</span>
              </div>
            </div>

            {/* Print + Digital — popular — lifted 12px */}
            <div className="card-hover reveal" style={{ background: `linear-gradient(145deg, rgba(35,25,75,0.9), rgba(25,15,55,0.95))`, backdropFilter: "blur(20px)", border: `1px solid rgba(232,192,122,0.28)`, borderRadius: 24, padding: "36px 32px", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(232,192,122,0.12)", position: "relative", overflow: "hidden", transform: "translateY(-12px)" }}>
              {/* Gold top gradient accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_WARM})` }} />
              {/* Most Popular ribbon */}
              <div style={{ position: "absolute", top: 20, right: 20, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 50, letterSpacing: "0.06em" }}>Most Popular</div>

              <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Print + Digital</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 2, marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 20, fontWeight: 600, color: GOLD, lineHeight: 1, marginTop: 10 }}>$</span>
                <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 52, fontWeight: 600, color: TEXT, lineHeight: 1 }}>37</span>
                <span style={{ fontSize: 22, color: MUTED, marginTop: 14, fontWeight: 600 }}>.99</span>
              </div>
              <p style={{ color: "rgba(245,240,224,0.38)", fontSize: 13, margin: "0 0 20px" }}>Delivered to your door in 5–7 days</p>

              {/* 3D book mockup inside the card */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <BookMockup3D coverImg="/examples/example-1.jfif" width={120} height={163} animate={false} />
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {PRINT_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: i === 0 ? "rgba(245,240,224,0.45)" : TEXT }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,192,122,0.12)", border: "1px solid rgba(232,192,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckSVG size={11} color={GOLD} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/create" style={{ textDecoration: "none", display: "block", width: "100%", padding: "14px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, textAlign: "center", color: BG_BASE, fontWeight: 700, fontSize: 15, boxShadow: "0 8px 28px rgba(232,192,122,0.3)" }}>
                Order Print Book →
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
                <StripeSVG /><VisaSVG /><McSVG />
              </div>
            </div>
          </div>

          <p className="reveal" style={{ textAlign: "center", color: MUTED, fontSize: 13, marginTop: 24 }}>🛡️ 30-day happiness promise. We're committed to making sure you love your book.</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "72px 24px" : "104px 48px", borderTop: `1px solid ${SURF_BDR}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: isMobile ? 44 : 64 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 14px" }}>Early Families</p>
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: 0, letterSpacing: "-0.5px" }}>What Parents Are Saying</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 20 }}>
            {REVIEWS.map((r, i) => (
              <div key={i} className="card-hover reveal" style={{ background: SURFACE, backdropFilter: "blur(16px)", border: `1px solid ${SURF_BDR}`, borderRadius: 24, padding: "28px 24px", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animationDelay: `${i * 0.12}s` }}>
                {/* Giant gold opening quote */}
                <div aria-hidden="true" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 72, lineHeight: 0.7, color: GOLD, opacity: 0.22, marginBottom: 16, fontWeight: 700, userSelect: "none" }}>"</div>
                <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>{[0,1,2,3,4].map(j => <StarSVG key={j} size={14} color={GOLD} />)}</div>
                <p style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 15, lineHeight: 1.8, color: TEXT, margin: "0 0 24px", fontStyle: "italic", flex: 1 }}>{r.text}</p>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 18 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>{AVATARS[i]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "80px 24px" : "112px 48px", textAlign: "center", position: "relative", overflow: "hidden", borderTop: `1px solid ${SURF_BDR}` }}>
        <div aria-hidden="true" style={{ position: "absolute", top: "20%", left: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,80,200,0.2) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
        {/* Sparkles */}
        {["12%,22%", "83%,28%", "42%,78%"].map((pos, i) => (
          <div key={i} aria-hidden="true" style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], animation: `sparkleAni ${3 + i * 0.8}s ease-in-out infinite`, animationDelay: `${i * 0.4}s`, opacity: 0.18, pointerEvents: "none" }}>
            <SparkSVG size={[28, 18, 22][i]} color={GOLD} glow />
          </div>
        ))}
        <div className="reveal" style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 18, animation: "float 4s ease-in-out infinite" }}><SparkSVG size={isMobile ? 40 : 52} color={GOLD} glow /></div>
          <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 32 : 48, fontWeight: 600, color: TEXT, margin: "0 0 18px", lineHeight: 1.12, letterSpacing: "-0.6px" }}>
            Give Them a Story Only{" "}
            <span style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_WARM}, ${GOLD})`, backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 3s ease infinite" }}>
              They Can Star In
            </span>
          </h2>
          <p style={{ color: MUTED, fontSize: isMobile ? 15 : 17, lineHeight: 1.7, margin: "0 0 40px" }}>
            Preview your child's book for free — see 2 pages before you spend a penny. No subscription, no commitment.
          </p>
          <Link href="/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: isMobile ? "16px 36px" : "18px 52px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: isMobile ? 16 : 18, boxShadow: "0 12px 40px rgba(232,192,122,0.3), inset 0 1px 0 rgba(255,255,255,0.3)", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(232,192,122,0.45), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(232,192,122,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
          >
            Try Free — No Card Needed →
          </Link>
          <p style={{ color: "rgba(245,240,224,0.28)", fontSize: 13, marginTop: 18 }}>See 2 pages free · No subscription required</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${SURF_BDR}`, padding: isMobile ? "52px 24px 36px" : "72px 48px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? "40px 24px" : 48, marginBottom: 56 }}>
            {/* Brand column */}
            <div style={{ gridColumn: isMobile ? "1 / -1" : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <SparkSVG size={20} color={GOLD} glow />
                <span style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontWeight: 600, fontSize: 18, color: TEXT }}>My Tiny Tales</span>
              </div>
              <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.7, margin: "0 0 16px", maxWidth: 280 }}>Personalised AI storybooks starring your child. Created with love, treasured for years.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>🇬🇧</span>
                <span style={{ color: MUTED, fontSize: 13 }}>Made with love in London</span>
              </div>
            </div>

            {/* Link columns */}
            {(Object.entries(FOOTER_LINKS) as [string, string[][]][]).map(([col, links]) => (
              <div key={col}>
                <div style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontWeight: 600, fontSize: 13, color: TEXT, marginBottom: 18, letterSpacing: "0.04em" }}>{col}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {links.map(([label, href]) =>
                    href === "__cookie__" ? (
                      <button key={label}
                        onClick={() => window.dispatchEvent(new Event("open_cookie_settings"))}
                        style={{ background: "none", border: "none", padding: 0, color: MUTED, fontSize: 14, textDecoration: "none", cursor: "pointer", textAlign: "left", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = TEXT}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = MUTED}
                      >{label}</button>
                    ) : (
                      <a key={label} href={href} style={{ color: MUTED, fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = TEXT}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = MUTED}
                      >{label}</a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom strip */}
          <div style={{ borderTop: `1px solid ${SURF_BDR}`, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <p style={{ color: "rgba(245,240,224,0.28)", fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} My Tiny Tales. All rights reserved.</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <StripeSVG /><VisaSVG /><McSVG />
              <span style={{ color: "rgba(245,240,224,0.2)", fontSize: 11 }}>SSL Secure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
