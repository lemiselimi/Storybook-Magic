"use client";
import { useState, useEffect } from "react";

type Consent = { necessary: true; analytics: boolean; marketing: boolean; savedAt?: number };

const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "linear-gradient(135deg, #E8C07A, #D4A24C)" : "rgba(255,255,255,0.15)",
        position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "white", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [consent, setConsent] = useState<Consent>({ necessary: true, analytics: false, marketing: false });

  // Show banner on first visit OR when consent has expired (6 months)
  useEffect(() => {
    const raw = localStorage.getItem("cookie_consent_v2");
    if (!raw) { setVisible(true); return; }
    try {
      const parsed: Consent = JSON.parse(raw);
      if (!parsed.savedAt || Date.now() - parsed.savedAt > SIX_MONTHS) {
        localStorage.removeItem("cookie_consent_v2");
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  // Allow footer "Cookie settings" link to re-open the modal
  useEffect(() => {
    const open = () => { setVisible(true); setShowModal(true); };
    window.addEventListener("open_cookie_settings", open);
    return () => window.removeEventListener("open_cookie_settings", open);
  }, []);

  const save = (c: Omit<Consent, "savedAt">) => {
    const full: Consent = { ...c, savedAt: Date.now() };
    localStorage.setItem("cookie_consent_v2", JSON.stringify(full));
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setVisible(false);
    setShowModal(false);
  };

  if (!visible) return null;

  const pill: React.CSSProperties = {
    position: "fixed", bottom: 24, left: 24, zIndex: 9999,
    maxWidth: 380, width: "calc(100vw - 48px)",
    background: "rgba(20,16,45,0.96)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: "18px 20px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
  };

  return (
    <>
      <div style={pill} role="dialog" aria-label="Cookie consent">
        <p style={{ color: "rgba(245,240,224,0.82)", fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>
          We use cookies to improve your experience.{" "}
          <a href="/privacy" style={{ color: "#E8C07A", textDecoration: "underline" }}>Privacy Policy</a>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => save({ necessary: true, analytics: false, marketing: false })} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(245,240,224,0.18)", background: "transparent", color: "rgba(245,240,224,0.55)", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            Reject all
          </button>
          <button onClick={() => setShowModal(true)} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(245,240,224,0.18)", background: "transparent", color: "rgba(245,240,224,0.55)", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            Customise
          </button>
          <button onClick={() => save({ necessary: true, analytics: true, marketing: true })} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #E8C07A, #D4A24C)", color: "#0F0B1F", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
            Accept all
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "rgba(20,16,45,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "36px 32px", maxWidth: 480, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <h3 style={{ color: "#F5F0E0", fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>Cookie Preferences</h3>
            <p style={{ color: "rgba(245,240,224,0.55)", fontSize: 13, margin: "0 0 28px", lineHeight: 1.6 }}>Choose which cookies you allow. You can change these at any time. Your choice is saved for 6 months.</p>

            {[
              { key: "necessary", label: "Necessary", desc: "Required for the site to function. Cannot be disabled.", locked: true },
              { key: "analytics", label: "Analytics", desc: "Help us understand how visitors use the site (Google Analytics). No personally identifiable data is collected.", locked: false },
              { key: "marketing", label: "Marketing", desc: "Used to deliver relevant advertisements.", locked: false },
            ].map(({ key, label, desc, locked }) => (
              <div key={key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div style={{ color: "#F5F0E0", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{label}{locked && <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(245,240,224,0.35)", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "2px 6px" }}>REQUIRED</span>}</div>
                  <div style={{ color: "rgba(245,240,224,0.5)", fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
                </div>
                <Toggle
                  checked={locked ? true : consent[key as keyof Consent] as boolean}
                  disabled={locked}
                  onChange={v => setConsent(prev => ({ ...prev, [key]: v }))}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => save({ necessary: true, analytics: false, marketing: false })} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(245,240,224,0.18)", background: "transparent", color: "rgba(245,240,224,0.55)", fontSize: 13, cursor: "pointer", minWidth: 100 }}>Reject all</button>
              <button onClick={() => save(consent)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(232,192,122,0.4)", background: "transparent", color: "#E8C07A", fontSize: 13, cursor: "pointer", fontWeight: 600, minWidth: 100 }}>Save preferences</button>
              <button onClick={() => save({ necessary: true, analytics: true, marketing: true })} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #E8C07A, #D4A24C)", color: "#0F0B1F", fontSize: 13, cursor: "pointer", fontWeight: 700, minWidth: 100 }}>Accept all</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
