"use client";
import { useState } from "react";
import Link from "next/link";

const PURPLE_DARK = "#1a0a2e";
const PURPLE_MID = "#2d1b4e";
const GOLD = "#f4c430";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...form }),
      });
      if (res.ok) { setStatus("sent"); setForm({ name: "", email: "", subject: "", message: "" }); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fffef7", fontFamily: "var(--font-inter, 'Segoe UI', sans-serif)" }}>
      <nav style={{ background: PURPLE_DARK, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{ fontSize: 22 }}>✨</span>
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 700, fontSize: 18, color: "white" }}>My Tiny Tales</span>
        </Link>
        <Link href="/create" style={{ textDecoration: "none", padding: "8px 20px", borderRadius: 50, background: `linear-gradient(135deg, ${GOLD}, #ffb347)`, color: PURPLE_DARK, fontWeight: 700, fontSize: 13 }}>
          Create a Book →
        </Link>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 32px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 38, fontWeight: 700, color: PURPLE_DARK, marginBottom: 12 }}>Contact Us</h1>
          <p style={{ color: "#8a6d5a", fontSize: 16, margin: 0 }}>We typically reply within one business day.</p>
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 40 }}>
          {[
            { icon: "📖", title: "Refunds & Orders", desc: "30-day happiness promise — we'll work it out", link: "/faq#refund" },
            { icon: "🔒", title: "Privacy & Data", desc: "Questions about your child's data", link: "/privacy" },
          ].map((c) => (
            <Link key={c.title} href={c.link} style={{ textDecoration: "none", background: "white", borderRadius: 14, padding: "18px 20px", border: "1px solid #ede8dc", display: "flex", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: PURPLE_DARK, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#8a6d5a" }}>{c.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {status === "sent" ? (
          <div style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: 16, padding: "36px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 22, color: PURPLE_DARK, marginBottom: 8 }}>Message sent!</h2>
            <p style={{ color: "#3d2b1f", fontSize: 15, margin: 0 }}>Thank you for reaching out. We'll reply to your email within one business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <style>{`input,textarea,select{font-family:inherit;} input:focus,textarea:focus,select:focus{outline:none;border-color:rgba(107,63,160,0.5)!important;}`}</style>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[{ label: "Your name", key: "name", type: "text", placeholder: "Jane Smith" }, { label: "Email address", key: "email", type: "email", placeholder: "jane@example.com" }].map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", color: "#6b5447", fontSize: 13, fontWeight: 600, marginBottom: 7 }}>{f.label}</label>
                  <input
                    type={f.type} required value={(form as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0d4c8", background: "white", fontSize: 14, color: "#3d2b1f", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            <div>
              <label style={{ display: "block", color: "#6b5447", fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Subject</label>
              <select value={form.subject} required onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0d4c8", background: "white", fontSize: 14, color: "#3d2b1f" }}>
                <option value="">Select a topic…</option>
                <option>Refund or order issue</option>
                <option>Technical problem</option>
                <option>Print order question</option>
                <option>Privacy or data question</option>
                <option>Partnership or press</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#6b5447", fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Message</label>
              <textarea required value={form.message} placeholder="Tell us how we can help…" rows={5}
                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0d4c8", background: "white", fontSize: 14, color: "#3d2b1f", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            {status === "error" && <p style={{ color: "#e53935", fontSize: 13, margin: 0 }}>Something went wrong — please email us directly at hello@mytinytales.studio</p>}
            <button type="submit" disabled={status === "sending"} style={{ padding: "14px 32px", borderRadius: 50, border: "none", background: status === "sending" ? "rgba(107,63,160,0.4)" : `linear-gradient(135deg, ${PURPLE_MID}, #6b3fa0)`, color: "white", fontWeight: 700, fontSize: 15, cursor: status === "sending" ? "not-allowed" : "pointer" }}>
              {status === "sending" ? "Sending…" : "Send Message →"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ color: "#8a6d5a", fontSize: 13 }}>Or email us directly at <a href="mailto:hello@mytinytales.studio" style={{ color: PURPLE_MID, fontWeight: 600 }}>hello@mytinytales.studio</a></p>
        </div>
      </div>

      <footer style={{ background: PURPLE_DARK, padding: "24px 32px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
          © {new Date().getFullYear()} My Tiny Tales ·{" "}
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Privacy</Link>
          {" · "}
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms</Link>
          {" · "}
          <Link href="/faq" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>FAQ</Link>
        </p>
      </footer>
    </div>
  );
}
