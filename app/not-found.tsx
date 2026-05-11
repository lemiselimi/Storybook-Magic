import Link from "next/link";

const GOLD     = "#E8C07A";
const TEXT     = "#F5F0E0";
const BG_BASE  = "#0F0B1F";
const MUTED    = "rgba(245,240,224,0.6)";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", background: BG_BASE, color: TEXT, fontFamily: "var(--font-inter, sans-serif)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px" }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 120, fontWeight: 700, color: GOLD, opacity: 0.12, lineHeight: 1, marginBottom: 8, userSelect: "none" }}>
          404
        </div>
        <div style={{ marginBottom: 24, marginTop: -16 }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill={GOLD} aria-hidden="true" style={{ filter: `drop-shadow(0 0 8px ${GOLD}60)` }}>
            <path d="M12 1l2.39 7.61L22 12l-7.61 2.39L12 22l-2.39-7.61L2 12l7.61-2.39z" />
          </svg>
        </div>
        <h1 style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 28, fontWeight: 600, color: TEXT, margin: "0 0 14px", lineHeight: 1.2 }}>
          This page got lost in the story
        </h1>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: "0 0 36px" }}>
          The page you're looking for doesn't exist — but your child's adventure is just one click away.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, #D4A24C)`, color: BG_BASE, fontWeight: 700, fontSize: 15 }}>
            ← Back to home
          </Link>
          <Link href="/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 50, border: "1px solid rgba(232,192,122,0.28)", color: TEXT, fontWeight: 600, fontSize: 15 }}>
            Create a book →
          </Link>
        </div>
      </div>
    </main>
  );
}
