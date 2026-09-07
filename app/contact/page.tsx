"use client";
import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact",
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(38,49,61,0.06)",
    border: "1px solid rgba(38,49,61,0.12)",
    borderRadius: 10,
    padding: "14px 16px",
    color: "#26313D",
    fontSize: 16,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#FBF6EC", color: "#26313D", fontFamily: "Georgia, serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 24px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 8, color: "#26313D" }}>
          Get in Touch
        </h1>
        <p style={{ fontSize: 17, color: "#5C6672", marginBottom: 8 }}>
          Questions, feedback, or something not quite right? We'd love to hear from you.
        </p>
        <p style={{ fontSize: 14, color: "#6A7078", marginBottom: 48 }}>
          We reply within one business day.
        </p>

        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
            <h2 style={{ fontSize: 24, marginBottom: 12 }}>Message sent!</h2>
            <p style={{ color: "#5C6672" }}>
              We'll get back to you within one business day.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#5C6672" }}>
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
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#5C6672" }}>
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
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#5C6672" }}>
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
            {status === "error" && (
              <p style={{ color: "#ff6b6b", fontSize: 14, margin: 0 }}>
                Something went wrong. Please email us directly at hello@mytinytales.studio
              </p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                background: status === "sending" ? "rgba(192,134,58,0.5)" : "#C0863A",
                color: "#2A1D10",
                fontWeight: 700,
                fontSize: 16,
                padding: "16px",
                borderRadius: 12,
                border: "none",
                cursor: status === "sending" ? "default" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}

        <p style={{ marginTop: 48, fontSize: 14, color: "#6A7078", textAlign: "center" }}>
          Or email us directly at{" "}
          <a href="mailto:hello@mytinytales.studio" style={{ color: "#5C6672" }}>
            hello@mytinytales.studio
          </a>
        </p>
      </div>
    </main>
  );
}
