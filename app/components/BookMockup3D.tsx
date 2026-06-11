"use client";

interface Props {
  coverImg: string;
  width?: number;
  height?: number;
  animate?: boolean;
  /** Cover swings open as the ancestor's --book-open CSS var goes 0 → 1 */
  scrollOpen?: boolean;
}

export default function BookMockup3D({ coverImg, width = 200, height = 272, animate = true, scrollOpen = false }: Props) {
  const T = 34; // spine/thickness

  return (
    <div style={{ perspective: 1100, display: "inline-block", filter: "drop-shadow(0 32px 56px rgba(0,0,0,0.7))" }}>
      <div style={{
        width: width + T,
        height,
        position: "relative",
        transformStyle: "preserve-3d",
        transform: scrollOpen
          ? "rotateY(calc(-28deg + var(--book-open, 0) * 22deg)) rotateX(calc(4deg - var(--book-open, 0) * 2deg))"
          : "rotateY(-28deg) rotateX(4deg)",
        animation: animate && !scrollOpen ? "float3d 6s ease-in-out infinite alternate" : "none",
      }}>
        {/* Inside page — revealed when the cover opens */}
        {scrollOpen && (
          <div aria-hidden="true" style={{
            position: "absolute", left: T, top: 2, width: width - 3, height: height - 4,
            borderRadius: "0 5px 5px 0",
            background: "#F5F0E0",
            boxShadow: "inset 14px 0 22px rgba(0,0,0,0.14)",
            padding: "10% 9%",
            overflow: "hidden",
            transform: "translateZ(-1px)",
          }}>
            <div style={{ width: "72%", height: "44%", borderRadius: 6, overflow: "hidden", marginBottom: "8%" }}>
              <img src={coverImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "saturate(0.92)", display: "block" }} />
            </div>
            {[82, 94, 76, 88, 58].map((w, i) => (
              <div key={i} style={{ width: `${w}%`, height: 5, borderRadius: 3, background: "rgba(20,16,8,0.16)", marginBottom: 7 }} />
            ))}
          </div>
        )}

        {/* Front cover — flips open around the spine when scrollOpen */}
        <div style={{
          position: "absolute", left: T, top: 0, width, height,
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
          transform: scrollOpen ? "rotateY(calc(var(--book-open, 0) * -130deg))" : undefined,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            borderRadius: "0 6px 6px 0",
            overflow: "hidden",
            backfaceVisibility: "hidden",
            boxShadow: "inset -5px 0 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
          }}>
            <img src={coverImg} alt="Book cover" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
            {/* Sheen */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 45%)", pointerEvents: "none" }} />
          </div>
          {/* Inside of the cover — visible mid-flip */}
          {scrollOpen && (
            <div aria-hidden="true" style={{
              position: "absolute", inset: 0,
              borderRadius: "6px 0 0 6px",
              background: "linear-gradient(105deg, #EFE8D2, #E2D8BC)",
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              boxShadow: "inset 6px 0 14px rgba(0,0,0,0.12)",
            }} />
          )}
        </div>

        {/* Spine — perpendicular to cover */}
        <div style={{
          position: "absolute", left: T, top: 0, width: T, height,
          background: "linear-gradient(to right, #08041a, #180c30, #0f0720)",
          borderRadius: "6px 0 0 6px",
          transformOrigin: "left center",
          transform: "rotateY(90deg)",
          backfaceVisibility: "hidden",
          boxShadow: "inset -3px 0 8px rgba(0,0,0,0.6)",
        }}>
          <div style={{ position: "absolute", right: 3, top: 24, bottom: 24, width: 1, background: "rgba(232,192,122,0.18)" }} />
        </div>

        {/* Page stack — right edge */}
        <div style={{
          position: "absolute", left: T + width, top: 4, width: 10, height: height - 8,
          transformOrigin: "left center",
          transform: "rotateY(-90deg)",
          backfaceVisibility: "hidden",
          background: "repeating-linear-gradient(to bottom, #f5f0e0, #f5f0e0 1px, #e8e0c4 1px, #e8e0c4 3px)",
          borderRadius: "0 2px 2px 0",
        }} />

        {/* Top edge */}
        <div style={{
          position: "absolute", left: T, top: 0, width, height: 10,
          background: "linear-gradient(to bottom, #d8cca0, #c8bc8c)",
          transformOrigin: "top center",
          transform: "rotateX(90deg) translateY(-5px)",
          backfaceVisibility: "hidden",
        }} />

        {/* Bottom edge */}
        <div style={{
          position: "absolute", left: T, bottom: 0, width, height: 10,
          background: "linear-gradient(to top, #d8cca0, #c8bc8c)",
          transformOrigin: "bottom center",
          transform: "rotateX(-90deg) translateY(5px)",
          backfaceVisibility: "hidden",
        }} />
      </div>
      <style>{`
        @keyframes float3d {
          from { transform: rotateY(-28deg) rotateX(4deg) translateY(0); }
          to   { transform: rotateY(-22deg) rotateX(2deg) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
