"use client";
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent("Message from " + form.name);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:hello@mytinytales.studio?subject=${subject}&body=${body}`;
    setSent(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "14px 16px",
    color: "#EDE8D5",
    fontSize: 16,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0D0820", color: "#EDE8D5", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: "#F5A623" }}>
          Get in Touch
        </h1>
        <p style={{ fontSize: 17, color: "#B8A9C9", marginBottom: 48 }}>
          Questions, feedback, or something not quite right? We'd love to hear from you.
        </p>

        {sent ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Your email client is open!</h2>
            <p style={{ color: "#B8A9C9" }}>
              We'll get back to you within 1–2 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#B8A9C9" }}>
                Your name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Alex"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#B8A9C9" }}>
                Email address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#B8A9C9" }}>
                Message
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Tell us what's on your mind..."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: "#F5A623",
                color: "#0D0820",
                fontWeight: 700,
                fontSize: 16,
                padding: "16px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Send Message
            </button>
          </form>
        )}

        <p style={{ marginTop: 48, fontSize: 14, color: "#6B5A7A", textAlign: "center" }}>
          Or email us directly at{" "}
          <a href="mailto:hello@mytinytales.studio" style={{ color: "#B8A9C9" }}>
            hello@mytinytales.studio
          </a>
        </p>
      </div>
    </main>
  );
}
