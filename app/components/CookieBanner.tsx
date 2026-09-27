"use client";
import { useState, useEffect, useRef } from "react";

type Consent = { necessary: true; analytics: boolean; marketing: boolean; savedAt?: number };

const SIX_MONTHS = 6 * 30 * 24 * 60 * 60 * 1000;

function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        width: 44, height: 44, border: "none", cursor: disabled ? "not-allowed" : "pointer",
        background: "transparent",
        position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ position: "absolute", top: 10, left: 0, width: 44, height: 24, borderRadius: 12, background: checked ? "#A94F38" : "rgba(31,42,40,0.16)" }} />
      <span style={{
        position: "absolute", top: 13, left: checked ? 23 : 3, width: 18, height: 18,
        borderRadius: "50%", background: "#FBF6EC", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(31,42,40,0.24)",
      }} />
    </button>
  );
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [consent, setConsent] = useState<Consent>({ necessary: true, analytics: false, marketing: false });
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Show banner on first visit OR when consent has expired (6 months)
  // Hydrate browser-only storage after SSR; the server cannot read localStorage.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cookie_consent_v2");
      if (!raw) { setVisible(true); return; }
      const parsed: Consent = JSON.parse(raw);
      if (!parsed.savedAt || Date.now() - parsed.savedAt > SIX_MONTHS) {
        localStorage.removeItem("cookie_consent_v2");
        setVisible(true);
      } else {
        setConsent({ necessary: true, analytics: parsed.analytics === true, marketing: parsed.marketing === true, savedAt: parsed.savedAt });
      }
    } catch {
      setVisible(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!showModal || !dialogRef.current) return;
    dialogRef.current.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [showModal]);

  // Allow footer "Cookie settings" link to re-open the modal
  useEffect(() => {
    const open = () => { setShowModal(true); };
    window.addEventListener("open_cookie_settings", open);
    return () => window.removeEventListener("open_cookie_settings", open);
  }, []);

  const save = (c: Omit<Consent, "savedAt">) => {
    const full: Consent = { ...c, savedAt: Date.now() };
    try { localStorage.setItem("cookie_consent_v2", JSON.stringify(full)); } catch { /* Storage may be unavailable in private browsing. */ }
    setConsent(full);
    window.dispatchEvent(new Event("cookie_consent_updated"));
    setVisible(false);
    setShowModal(false);
  };

  if (!visible && !showModal) return null;

  const pill: React.CSSProperties = {
    position: "fixed", bottom: 16, left: 16, zIndex: 9999,
    maxWidth: 390, width: "calc(100vw - 32px)",
    background: "#FBF6EC",
    border: "1px solid rgba(31,42,40,0.18)",
    borderRadius: 4, padding: "18px 20px",
    boxShadow: "0 12px 34px rgba(50,38,19,0.18)",
  };

  return (
    <>
      {visible && <div className="mtt-cookie-banner" style={pill} role="dialog" aria-label="Cookie consent">
        <p style={{ color: "rgba(31,42,40,0.82)", fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>
          We use cookies to improve your experience.{" "}
          <a href="/privacy" style={{ color: "#A94F38", textDecoration: "underline" }}>Privacy Policy</a>
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => save({ necessary: true, analytics: false, marketing: false })} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(31,42,40,0.20)", background: "transparent", color: "#1F2A28", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            Reject all
          </button>
          <button onClick={() => setShowModal(true)} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(31,42,40,0.20)", background: "transparent", color: "#1F2A28", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            Customise
          </button>
          <button onClick={() => save({ necessary: true, analytics: true, marketing: true })} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: "none", background: "#A94F38", color: "#FBF6EC", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
            Accept all
          </button>
        </div>
      </div>}

      {showModal && (
        <dialog ref={dialogRef} className="mtt-cookie-dialog" aria-labelledby="cookie-preferences-title" onCancel={() => setShowModal(false)} onClose={() => setShowModal(false)}>
          <div style={{ background: "#FBF6EC", border: "1px solid rgba(31,42,40,0.18)", borderRadius: 4, padding: "clamp(24px, 5vw, 36px)", maxWidth: 480, width: "100%", boxShadow: "0 24px 64px rgba(50,38,19,0.28)" }}>
            <button type="button" onClick={() => setShowModal(false)} aria-label="Close cookie preferences" style={{ float: "right", border: 0, background: "transparent", color: "#1f2a28", width: 44, height: 44, cursor: "pointer", fontSize: 24 }}>×</button>
            <h3 id="cookie-preferences-title" style={{ color: "#1F2A28", fontFamily: "var(--font-fraunces, Georgia, serif)", fontSize: 22, fontWeight: 600, margin: "0 0 8px" }}>Cookie Preferences</h3>
            <p style={{ color: "rgba(31,42,40,0.68)", fontSize: 13, margin: "0 0 28px", lineHeight: 1.6 }}>Choose which cookies you allow. You can change these at any time. Your choice is saved for 6 months.</p>

            {[
              { key: "necessary", label: "Necessary", desc: "Required for the site to function. Cannot be disabled.", locked: true },
              { key: "analytics", label: "Analytics", desc: "Help us understand how visitors use the site (Google Analytics). No personally identifiable data is collected.", locked: false },
              { key: "marketing", label: "Marketing", desc: "Used to deliver relevant advertisements.", locked: false },
            ].map(({ key, label, desc, locked }) => (
              <div key={key} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "16px 0", borderBottom: "1px solid rgba(31,42,40,0.12)" }}>
                <div>
                  <div style={{ color: "#1F2A28", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{label}{locked && <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(31,42,40,0.58)", background: "rgba(31,42,40,0.08)", borderRadius: 4, padding: "2px 6px" }}>REQUIRED</span>}</div>
                  <div style={{ color: "rgba(31,42,40,0.64)", fontSize: 12, lineHeight: 1.5 }}>{desc}</div>
                </div>
                <Toggle
                  label={`${label} cookies`}
                  checked={locked ? true : consent[key as keyof Consent] as boolean}
                  disabled={locked}
                  onChange={v => setConsent(prev => ({ ...prev, [key]: v }))}
                />
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => save({ necessary: true, analytics: false, marketing: false })} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(31,42,40,0.20)", background: "transparent", color: "#1F2A28", fontSize: 13, cursor: "pointer", minWidth: 100 }}>Reject all</button>
              <button onClick={() => save(consent)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(169,79,56,0.55)", background: "transparent", color: "#A94F38", fontSize: 13, cursor: "pointer", fontWeight: 600, minWidth: 100 }}>Save preferences</button>
              <button onClick={() => save({ necessary: true, analytics: true, marketing: true })} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "none", background: "#A94F38", color: "#FBF6EC", fontSize: 13, cursor: "pointer", fontWeight: 700, minWidth: 100 }}>Accept all</button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
