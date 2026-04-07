"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) setVisible(true);
  }, []);

  const accept = () => { localStorage.setItem("cookie_consent", "1"); setVisible(false); };
  const decline = () => { localStorage.setItem("cookie_consent", "0"); setVisible(false); };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "rgba(26,10,46,0.97)", backdropFilter: "blur(12px)",
      borderTop: "1px solid rgba(255,215,0,0.15)",
      padding: "16px 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 16, flexWrap: "wrap",
    }}>
      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, margin: 0, flex: 1, minWidth: 240 }}>
        We use cookies to improve your experience and analyse usage.{" "}
        <a href="/privacy" style={{ color: "#ffd700", textDecoration: "underline" }}>Privacy Policy</a>
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={decline} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }}>
          Decline
        </button>
        <button onClick={accept} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #ffd700, #ffb347)", color: "#1a0a2e", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Accept
        </button>
      </div>
    </div>
  );
}
