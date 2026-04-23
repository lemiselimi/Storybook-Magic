"use client";

interface Props {
  coverImg: string;
  width?: number;
  height?: number;
  animate?: boolean;
}

export default function BookMockup3D({ coverImg, width = 200, height = 272, animate = true }: Props) {
  const T = 34; // spine/thickness

  return (
    <div style={{ perspective: 1100, display: "inline-block", filter: "drop-shadow(0 32px 56px rgba(0,0,0,0.7))" }}>
      <div style={{
        width: width + T,
        height,
        position: "relative",
        transformStyle: "preserve-3d",
        transform: "rotateY(-28deg) rotateX(4deg)",
        animation: animate ? "float3d 6s ease-in-out infinite alternate" : "none",
      }}>
        {/* Front cover */}
        <div style={{
          position: "absolute", left: T, top: 0, width, height,
          borderRadius: "0 6px 6px 0",
          overflow: "hidden",
          backfaceVisibility: "hidden",
          boxShadow: "inset -5px 0 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        }}>
          <img src={coverImg} alt="Book cover" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
          {/* Sheen */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 45%)", pointerEvents: "none" }} />
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
