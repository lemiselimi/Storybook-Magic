"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BookMockup3D from "./components/BookMockup3D";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD       = "#E8C07A";
const GOLD_WARM  = "#D4A24C";
const TEXT       = "#F5F0E0";
const MUTED      = "rgba(245,240,224,0.65)";
const BG_BASE    = "#07090F";
const BG_EL      = "#0E1118";
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
function CheckSVG({ size = 14, color = GOLD, delay = 0 }: { size?: number; color?: string; delay?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline className="check-draw" pathLength={1} style={{ animationDelay: `${delay}s` }} points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Trust bar inline SVG icons ────────────────────────────────────────────────
function TrustStarSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={GOLD} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function TrustFlashSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={GOLD} aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function TrustLockSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function TrustShieldSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const EXAMPLES = [
  { tag: "The Big Adventure", title: "A Real Hero", caption: "Your child as the hero: brave, kind, and unforgettable.", img: "/examples/example-1.webp", quote: '"Loki was a real hero! He learned that being brave and kind saves the day. What an amazing adventure!"', child: "Loki, Age 4, Adventure theme" },
  { tag: "To The Stars",       title: "She Reached the Stars", caption: "Every page packed with heart. Your child's real face in every scene.", img: "/examples/example-2.webp", quote: '"Aria blasted off into the cosmos and discovered that the bravest explorers carry kindness in their hearts."', child: "Aria, Age 6, Space theme" },
  { tag: "Dragon Tamer",       title: "The Dragon Needed Him", caption: "Cinematic Pixar-style illustrations made just for them.", img: "/examples/example-3.webp", quote: '"Only Noah had what it took. He walked right up to the great dragon and said: I\'m here to help."', child: "Noah, Age 5, Dragon theme" },
];

const STEPS = [
  { num: "01", title: "Upload a Photo",        desc: "One clear photo is all we need. Our AI reads your child's features to create a cinematic 3D character that looks just like them." },
  { num: "02", title: "Personalise the Story", desc: "Enter their name, age, and choose an adventure theme. AI writes a story crafted just for them: every word, every scene." },
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
  "Premium softcover, 8×8 inch",
  "Matte-laminated cover, 28 pages",
  "Ships within 5-7 days",
];

const FOOTER_LINKS = {
  Product:  [["Examples", "#examples"], ["Pricing", "#pricing"], ["FAQ", "/faq"]],
  Company:  [["About", "/contact"], ["Contact", "/contact"], ["FAQ", "/faq"]],
  Legal:    [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "/refunds"], ["Children's Data", "/childrens-data"], ["Cookie Settings", "__cookie__"]],
};

// ── Illustrated avatars ───────────────────────────────────────────────────────

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
  const [scrolled,      setScrolled]      = useState(false);
  const [isMobile,      setIsMobile]      = useState(false);
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [exIdx,         setExIdx]         = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const blobARef = useRef<HTMLDivElement>(null);
  const blobBRef = useRef<HTMLDivElement>(null);
  const bookRef  = useRef<HTMLDivElement>(null);

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

  // Scroll reveal
  useEffect(() => {
    if (reducedMotion) {
      document.querySelectorAll<HTMLElement>(".reveal, .draw-line").forEach(el => el.classList.add("visible"));
      return;
    }
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal, .draw-line").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [reducedMotion]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Hero pointer parallax — blobs and book drift at different depths
  useEffect(() => {
    if (isMobile || reducedMotion) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = e.clientX / window.innerWidth  - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        if (blobARef.current) blobARef.current.style.transform = `translate3d(${x * 26}px, ${y * 26}px, 0)`;
        if (blobBRef.current) blobBRef.current.style.transform = `translate3d(${x * -20}px, ${y * -20}px, 0)`;
        if (bookRef.current)  bookRef.current.style.transform  = `translate3d(${x * 9}px, ${y * 9}px, 0)`;
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobile, reducedMotion]);

  // Scroll-driven book opening: --book-open goes 0 → 1 over the first ~55vh of scroll
  useEffect(() => {
    if (isMobile || reducedMotion) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.55)));
        bookRef.current?.style.setProperty("--book-open", p.toFixed(3));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isMobile, reducedMotion]);

  // Card tilt: rotate gently toward the cursor
  const tiltCard = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion || isMobile) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  };
  const untiltCard = (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = ""; };

  // Magnetic CTA: drift a few px toward the cursor
  const magnetMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion || isMobile) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = Math.max(-5, Math.min(5, (e.clientX - r.left - r.width / 2) * 0.06));
    const y = Math.max(-4, Math.min(4, (e.clientY - r.top - r.height / 2) * 0.14));
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  };

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
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes kenBurns { from{transform:scale(1)} to{transform:scale(1.05)} }
        @keyframes slideEx  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes wordUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes drawLine { to{stroke-dashoffset:0} }
        .word-reveal { display:inline-block; opacity:0; animation: wordUp 0.6s cubic-bezier(0.22,0.7,0.3,1) both; }
        .underline-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: drawLine 0.7s ease 0.95s both; }
        .cta-arrow { display:inline-block; transition: transform 0.2s; }
        a:hover .cta-arrow { transform: translateX(3px); }
        @keyframes spinGlow { to { transform: rotate(360deg) } }
        @keyframes shimmer  { 0%, 86% { transform: translateX(-220%) skewX(-18deg) } 97%, 100% { transform: translateX(340%) skewX(-18deg) } }
        @keyframes starIn   { from { opacity: 0; transform: scale(0.4) } to { opacity: 1; transform: scale(1) } }
        .glow-spin { position: absolute; inset: -150%; background: conic-gradient(from 0deg, transparent 0%, transparent 68%, rgba(232,192,122,0.9) 80%, rgba(232,192,122,0.15) 90%, transparent 100%); animation: spinGlow 7s linear infinite; }
        .cta-shimmer { position: relative; overflow: hidden; }
        .cta-shimmer::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 55%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.38), transparent); transform: translateX(-220%) skewX(-18deg); animation: shimmer 7s ease-in-out infinite; pointer-events: none; }
        .draw-line { clip-path: inset(-4px 100% -4px 0); transition: clip-path 1.4s ease 0.25s; }
        .draw-line.visible { clip-path: inset(-4px 0 -4px 0); }
        .check-draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
        .visible .check-draw { animation: drawLine 0.45s ease both; }
        .star-pop { display: inline-flex; opacity: 0; }
        .visible .star-pop { animation: starIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
        .card-tilt { transition: transform 0.18s ease-out, box-shadow 0.25s ease, border-color 0.25s ease; }
        .card-tilt:hover { border-color: rgba(255,255,255,0.16) !important; box-shadow: 0 24px 64px rgba(0,0,0,0.45) !important; }
        @media (prefers-reduced-motion: reduce) {
          .word-reveal, .underline-draw, .star-pop { animation: none; opacity: 1; stroke-dashoffset: 0; }
          .check-draw { stroke-dashoffset: 0; }
          .draw-line { clip-path: none; }
          .glow-spin, .cta-shimmer::after { animation: none; }
        }
        .card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px) !important; border-color: rgba(255,255,255,0.16) !important; box-shadow: 0 24px 64px rgba(0,0,0,0.4) !important; }
        .nav-link { color: rgba(245,240,224,0.65); font-size: 14px; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: #F5F0E0; }
        * { box-sizing: border-box; }
      `}</style>

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
          <Link href="/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7, padding: isMobile ? "8px 16px" : "10px 20px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: isMobile ? 12 : 14, boxShadow: "0 4px 16px rgba(232,192,122,0.25)", transition: "box-shadow 0.2s, transform 0.2s", whiteSpace: "nowrap" }}>
            Create your book <span className="cta-arrow">→</span>
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
        {/* Aurora blobs — warm amber/indigo, skip on mobile */}
        {!isMobile && <>
          <div ref={blobARef} aria-hidden="true" style={{ position: "absolute", top: "-25%", left: "-15%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,192,122,0.12) 0%, transparent 70%)", filter: "blur(100px)", pointerEvents: "none", transition: "transform 0.4s ease-out", willChange: "transform" }} />
          <div ref={blobBRef} aria-hidden="true" style={{ position: "absolute", bottom: "-25%", right: "-15%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(90,60,180,0.15) 0%, transparent 70%)", filter: "blur(120px)", pointerEvents: "none", transition: "transform 0.4s ease-out", willChange: "transform" }} />
        </>}

        <div style={{ maxWidth: 1200, width: "100%", display: "flex", alignItems: "center", gap: isMobile ? 0 : 72, flexDirection: isMobile ? "column" : "row" }}>
          {/* Left content */}
          <div style={{ flex: 1, animation: "fadeUp 0.9s ease both" }}>
            <p style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>My Tiny Tales</p>

            {/* H1 */}
            <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 36 : 58, fontWeight: 600, lineHeight: 1.12, color: TEXT, margin: "0 0 22px", letterSpacing: "-0.8px" }}>
              <span className="word-reveal" style={{ animationDelay: "0.05s" }}>Your</span>{" "}
              <span className="word-reveal" style={{ animationDelay: "0.14s" }}>Child,</span>{" "}
              <span className="word-reveal" style={{ position: "relative", animationDelay: "0.23s" }}>
                The Hero
                <svg aria-hidden="true" style={{ position: "absolute", bottom: -10, left: -4, width: "calc(100% + 8px)", height: 14 }} viewBox="0 0 200 14" preserveAspectRatio="none">
                  <path className="underline-draw" pathLength={1} d="M3 10 C35 3, 75 14, 115 7 C155 0, 182 12, 197 8" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>{" "}
              <span className="word-reveal" style={{ animationDelay: "0.38s" }}>of</span>{" "}
              <span className="word-reveal" style={{ animationDelay: "0.47s" }}>Their</span>{" "}
              <span className="word-reveal" style={{ animationDelay: "0.56s" }}>Story</span>
            </h1>

            {/* Subtext — tighter, ≤18 words */}
            <p style={{ fontSize: isMobile ? 16 : 19, color: MUTED, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 530 }}>
              A unique book starring your child's real face: cinematic 3D illustrations, a story written just for them.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/create" className="cta-shimmer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: isMobile ? "15px 28px" : "17px 40px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: isMobile ? 15 : 17, boxShadow: "0 8px 32px rgba(232,192,122,0.25), inset 0 1px 0 rgba(255,255,255,0.3)", transition: "transform 0.2s ease-out, box-shadow 0.2s" }}
                onMouseMove={magnetMove}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(232,192,122,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(232,192,122,0.25), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
              >
                Try Free, No Card Needed <span className="cta-arrow">→</span>
              </Link>
              <a href="#examples" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: isMobile ? "15px 24px" : "17px 32px", borderRadius: 50, border: "1px solid rgba(245,240,224,0.28)", background: "transparent", color: "rgba(245,240,224,0.85)", fontWeight: 600, fontSize: isMobile ? 14 : 16, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(245,240,224,0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                See Examples
              </a>
            </div>

            {/* Trust row — honest, verifiable signals only */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
              <span style={{ color: MUTED, fontSize: 13 }}>Free 2-page preview</span>
              <span style={{ width: 1, height: 16, background: "rgba(245,240,224,0.15)" }} />
              <span style={{ color: MUTED, fontSize: 13 }}>No subscription</span>
              <span style={{ width: 1, height: 16, background: "rgba(245,240,224,0.15)" }} />
              <span style={{ color: MUTED, fontSize: 13 }}>30-day money-back promise</span>
            </div>
          </div>

          {/* Right — book image */}
          {!isMobile && (
            <div style={{ flexShrink: 0, animation: "fadeUp 1s ease 0.3s both" }}>
              <div ref={bookRef} style={{ transition: "transform 0.3s ease-out", willChange: "transform" }}>
                <BookMockup3D coverImg="/examples/example-1.webp" width={300} height={400} animate={!reducedMotion} scrollOpen={!reducedMotion} />
              </div>
              <p style={{ color: "rgba(245,240,224,0.35)", fontSize: 11, letterSpacing: "0.06em", marginTop: 12, textAlign: "center" }}>Pixar-style illustrations from a real book · Scroll to peek inside</p>
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
            { icon: <TrustFlashSVG />,  value: "Ready in 5 min",  label: "From photo to preview" },
            { icon: <TrustStarSVG />,   value: "Free Preview",    label: "See 2 pages before you pay" },
            { icon: <TrustLockSVG />,   value: "Private by Default", label: "Photos auto-delete within 48h" },
            { icon: <TrustShieldSVG />, value: "30-Day Promise",  label: "Love it or your money back" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>{t.icon}</span>
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
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.15, letterSpacing: "-0.5px" }}>How It Works</h2>
          </div>

          <div style={{ display: "flex", gap: isMobile ? 40 : 0, flexDirection: isMobile ? "column" : "row", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
            {/* Dotted connecting line */}
            {!isMobile && (
              <div className="draw-line" aria-hidden="true" style={{ position: "absolute", top: 52, left: "16%", right: "16%", height: 0, borderTop: `2px dashed rgba(232,192,122,0.28)`, zIndex: 0 }} />
            )}

            {STEPS.map((s, i) => (
              <div key={i} className="reveal" style={{ flex: 1, textAlign: isMobile ? "left" : "center", padding: isMobile ? "0 0 0 16px" : "0 28px", position: "relative", zIndex: 1, display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 18 : 0, animationDelay: `${i * 0.15}s` }}>
                {isMobile ? (
                  /* Mobile: large muted numeral as left-side element */
                  <div style={{ fontSize: 56, fontWeight: 700, fontFamily: "var(--font-fraunces, Georgia, serif)", color: GOLD, opacity: 0.18, lineHeight: 1, flexShrink: 0, width: 64, textAlign: "center", userSelect: "none" }}>{s.num}</div>
                ) : (
                  /* Desktop: bold display number as explicit visual anchor */
                  <div style={{ fontSize: 72, fontWeight: 700, fontFamily: "var(--font-fraunces, Georgia, serif)", color: GOLD, opacity: 0.6, lineHeight: 1, marginBottom: 18, userSelect: "none" }}>{s.num}</div>
                )}
                <div style={{ textAlign: isMobile ? "left" : "center" }}>
                  <div style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontWeight: 600, fontSize: isMobile ? 17 : 18, color: TEXT, marginBottom: 10 }}>{s.title}</div>
                  <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          EXAMPLES
      ════════════════════════════════════════════════════ */}
      <section id="examples" style={{ padding: isMobile ? "72px 24px" : "104px 48px", borderTop: `1px solid ${SURF_BDR}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: isMobile ? 44 : 60 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 14px" }}>Real Examples</p>
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>See What Your Book Looks Like</h2>
            <p style={{ color: MUTED, fontSize: 15, margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>Real pages from a My Tiny Tales book. Every illustration features your child's actual face.</p>
          </div>

          <div style={{ position: "relative" }}>
            <div key={exIdx} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${SURF_BDR}`, backdropFilter: "blur(16px)", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: isMobile ? "column" : "row", animation: "slideEx 0.3s ease both", minHeight: isMobile ? undefined : 320, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
              <div style={{ flex: isMobile ? undefined : "0 0 48%", minHeight: isMobile ? 220 : 320, position: "relative", overflow: "hidden" }}>
                <img src={ex.img} alt={ex.title} loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
              </div>
              {!isMobile && <div style={{ width: 4, background: `linear-gradient(to right, rgba(232,192,122,0.12), rgba(232,192,122,0.04), transparent)`, flexShrink: 0 }} />}
              <div style={{ flex: 1, padding: isMobile ? "28px 24px" : "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
                <span style={{ background: `rgba(232,192,122,0.08)`, border: `1px solid rgba(232,192,122,0.2)`, borderRadius: 50, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: GOLD, display: "inline-block", width: "fit-content" }}>{ex.tag}</span>
                <h3 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 18 : 22, fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.3 }}>{ex.title}</h3>
                <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{ex.caption}</p>
                <p style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 14 : 16, lineHeight: 1.85, color: TEXT, margin: 0, fontStyle: "italic" }}>{ex.quote}</p>
                <p style={{ color: "rgba(245,240,224,0.35)", fontSize: 12, margin: 0, fontStyle: "italic" }}>Created for {ex.child}</p>
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
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: isMobile ? "72px 24px" : "104px 48px", borderTop: `1px solid ${SURF_BDR}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: isMobile ? 44 : 64 }}>
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.5px" }}>One Book, Infinite Memories</h2>
            <p style={{ color: MUTED, fontSize: 15, margin: 0 }}>No subscription. No hidden fees. Pay once, keep forever.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, alignItems: "end" }}>
            {/* Digital */}
            <div className="card-tilt reveal" onMouseMove={tiltCard} onMouseLeave={untiltCard} style={{ background: SURFACE, backdropFilter: "blur(20px)", border: `1px solid ${SURF_BDR}`, borderRadius: 24, padding: "36px 32px", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
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
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,192,122,0.08)", border: "1px solid rgba(232,192,122,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckSVG size={11} color={GOLD} delay={0.2 + i * 0.08} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/create" style={{ textDecoration: "none", display: "block", width: "100%", padding: "13px", borderRadius: 50, border: "1px solid rgba(245,240,224,0.25)", textAlign: "center", color: TEXT, fontWeight: 700, fontSize: 15, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(245,240,224,0.06)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                Try Free, No Card Needed →
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
                <StripeSVG /><VisaSVG /><McSVG />
                <span style={{ color: "rgba(245,240,224,0.25)", fontSize: 11 }}>SSL Encrypted</span>
              </div>
            </div>

            {/* Print + Digital — popular — lifted 12px */}
            <div className="reveal" style={{ position: "relative", borderRadius: 25, padding: 1.5, transform: "translateY(-12px)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}>
              {/* Rotating gold glow border */}
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: 25, overflow: "hidden" }}>
                <div className="glow-spin" />
              </div>
            <div className="card-tilt" onMouseMove={tiltCard} onMouseLeave={untiltCard} style={{ background: `linear-gradient(145deg, rgba(14,17,24,0.97), rgba(7,9,15,0.99))`, backdropFilter: "blur(20px)", borderRadius: 24, padding: "36px 32px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
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
              <p style={{ color: "rgba(245,240,224,0.38)", fontSize: 13, margin: "0 0 20px" }}>Delivered to your door in 5-7 days</p>

              {/* 3D book mockup inside the card */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <BookMockup3D coverImg="/examples/example-1.webp" width={120} height={163} animate={false} />
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {PRINT_FEATURES.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: i === 0 ? "rgba(245,240,224,0.45)" : TEXT }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,192,122,0.12)", border: "1px solid rgba(232,192,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckSVG size={11} color={GOLD} delay={0.2 + i * 0.08} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/create" className="cta-shimmer" style={{ textDecoration: "none", display: "block", width: "100%", padding: "14px", borderRadius: 50, border: "none", background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, textAlign: "center", color: BG_BASE, fontWeight: 700, fontSize: 15, boxShadow: "0 8px 28px rgba(232,192,122,0.3)" }}>
                Order Print Book <span className="cta-arrow">→</span>
              </Link>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
                <StripeSVG /><VisaSVG /><McSVG />
              </div>
            </div>
            </div>
          </div>

          <p className="reveal" style={{ textAlign: "center", color: MUTED, fontSize: 13, marginTop: 24 }}>30-day happiness promise. We're committed to making sure you love your book.</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          THE PROMISE — honest value section (no fabricated reviews pre-launch)
      ════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "72px 24px" : "104px 48px", borderTop: `1px solid ${SURF_BDR}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="reveal" style={{ textAlign: "center", marginBottom: isMobile ? 44 : 60 }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 14px" }}>Why My Tiny Tales</p>
            <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 30 : 44, fontWeight: 600, color: TEXT, margin: 0, letterSpacing: "-0.5px" }}>Made for One Child. Yours.</h2>
          </div>

          {/* Three promise cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
            {[
              { t: "Written from scratch", d: "Every book is authored around your child’s name, age, and the adventure you choose. No templates — no two alike." },
              { t: "Their real face, every page", d: "Not a cartoon stand-in. Our AI weaves your child’s actual likeness into all six cinematic illustrations." },
              { t: "Nothing to lose", d: "See two full pages free before you pay a penny — and every book is backed by our 30-day promise." },
            ].map((c, i) => (
              <div key={i} className="card-tilt reveal" onMouseMove={tiltCard} onMouseLeave={untiltCard} style={{ background: SURFACE, backdropFilter: "blur(16px)", border: `1px solid ${SURF_BDR}`, borderRadius: 24, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animationDelay: `${i * 0.12}s` }}>
                <span style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(232,192,122,0.1)", border: "1px solid rgba(232,192,122,0.24)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}><SparkSVG size={22} color={GOLD} glow /></span>
                <h3 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 19, fontWeight: 600, color: TEXT, margin: 0, lineHeight: 1.3 }}>{c.t}</h3>
                <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{c.d}</p>
              </div>
            ))}
          </div>

          {/* Guarantee band */}
          <div className="reveal" style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", textAlign: isMobile ? "left" : "center", flexWrap: "wrap", background: "rgba(232,192,122,0.05)", border: "1px solid rgba(232,192,122,0.18)", borderRadius: 20, padding: isMobile ? "22px 20px" : "26px 32px" }}>
            <span style={{ flexShrink: 0 }}><TrustShieldSVG /></span>
            <p style={{ color: TEXT, fontSize: isMobile ? 14 : 15, margin: 0, lineHeight: 1.6, maxWidth: 620 }}>
              <strong style={{ color: GOLD }}>Our 30-day happiness promise.</strong>{" "}
              If your book doesn’t bring a smile, email us within 30 days for a full refund — and keep the keepsake.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "80px 24px" : "112px 48px", textAlign: "center", position: "relative", overflow: "hidden", borderTop: `1px solid ${SURF_BDR}` }}>
        {!isMobile && (
          <div aria-hidden="true" style={{ position: "absolute", top: "20%", left: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,192,122,0.08) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />
        )}
        <div className="reveal" style={{ maxWidth: 560, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: isMobile ? 32 : 48, fontWeight: 600, color: TEXT, margin: "0 0 18px", lineHeight: 1.12, letterSpacing: "-0.6px" }}>
            Give Them a Story Only <em style={{ fontStyle: "italic", color: GOLD }}>They Can Star In</em>
          </h2>
          <p style={{ color: MUTED, fontSize: isMobile ? 15 : 17, lineHeight: 1.7, margin: "0 0 40px" }}>
            Preview your child's book for free. See 2 pages before you spend a penny. No subscription, no commitment.
          </p>
          <Link href="/create" className="cta-shimmer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: isMobile ? "16px 36px" : "18px 52px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_WARM})`, color: BG_BASE, fontWeight: 700, fontSize: isMobile ? 16 : 18, boxShadow: "0 12px 40px rgba(232,192,122,0.3), inset 0 1px 0 rgba(255,255,255,0.3)", transition: "transform 0.2s ease-out, box-shadow 0.2s" }}
            onMouseMove={magnetMove}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(232,192,122,0.45), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(232,192,122,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"; }}
          >
            Try Free, No Card Needed <span className="cta-arrow">→</span>
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
                <span style={{ color: MUTED, fontSize: 13 }}>Made in the USA</span>
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
