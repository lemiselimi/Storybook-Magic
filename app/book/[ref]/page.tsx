"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

type BookStatus = {
  status: "generating" | "pdf_generating" | "ready" | "failed" | "not_found";
  childName?: string;
  story?: { title?: string; dedication?: string; pages?: { pageNum: number; text: string }[] };
  plan?: string;
  coverUrl?: string | null;
  pageUrls?: (string | null)[];
  interiorPdfUrl?: string | null;
  completedAt?: string | null;
  printApproval?: "pending" | "submitted" | null;
};

const DARK  = "#07090F";
const CREAM = "#fdfcf7";
const GOLD  = "#E8C07A";
const BROWN = "#2a1505";

const CHAPTER_NAMES = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];

export default function BookPage() {
  const { ref } = useParams<{ ref: string }>();
  const [data, setData]       = useState<BookStatus | null>(null);
  const [isMobile, setMobile] = useState(false);
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [approving,        setApproving]        = useState(false);
  const [approveError,     setApproveError]     = useState<string | null>(null);

  const approvePrint = async () => {
    setShowPrintConfirm(false);
    setApproving(true);
    setApproveError(null);
    try {
      const res = await fetch("/api/approve-print", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ref }),
      });
      const json = await res.json();
      if (json.ok) setData(prev => prev ? { ...prev, printApproval: "submitted" } : prev);
      else setApproveError(json.error || "Something went wrong. Please contact hello@mytinytales.studio");
    } catch {
      setApproveError("Network error — please try again, or contact hello@mytinytales.studio");
    } finally {
      setApproving(false);
    }
  };

  useEffect(() => {
    setMobile(window.innerWidth < 680);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/book-status?ref=${ref}`);
      const json: BookStatus = await res.json();
      setData(json);
      if (json.status === "ready" || json.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch { /* silent — keep polling */ }
  };

  useEffect(() => {
    if (!ref) return;
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const isReady     = data?.status === "ready";
  const isFailed    = data?.status === "failed";
  const isGenerating = data?.status === "generating" || data?.status === "pdf_generating";

  const Spinner = ({ size = 28, color = GOLD }: { size?: number; color?: string }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `3px solid ${color}22`,
      borderTop: `3px solid ${color}`,
      animation: "spin 0.9s linear infinite",
    }} />
  );

  // Loading / preparing state
  if (!data || isGenerating) {
    const isPdf = data?.status === "pdf_generating";
    return (
      <div style={{ minHeight: "100vh", background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", fontFamily: "Georgia, serif" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }`}</style>
        <div style={{ fontSize: 48, marginBottom: 24 }}>✨</div>
        <h1 style={{ color: "white", fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: "0 0 12px", textAlign: "center" }}>
          {isPdf ? "Binding your book…" : "Illustrating your storybook…"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, margin: "0 0 32px", textAlign: "center", maxWidth: 380, lineHeight: 1.6 }}>
          {isPdf
            ? "All illustrations are done — generating your print-ready PDF."
            : "Our AI illustrators are painting each scene. This usually takes about 5 minutes."}
        </p>

        {data?.story?.pages && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32, width: "100%", maxWidth: 340 }}>
            {data.story.pages.map((_, i) => {
              const url = data.pageUrls?.[i];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,0.06)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {url
                      ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(232,192,122,0.2)", borderTop: "2px solid rgba(232,192,122,0.6)", animation: "spin 1s linear infinite" }} />
                    }
                  </div>
                  <span style={{ color: url ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic" }}>
                    {url ? `Chapter ${CHAPTER_NAMES[i]} ✓` : `Chapter ${CHAPTER_NAMES[i]}…`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Spinner size={32} />
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 20, textAlign: "center" }}>
          Keep this tab open — your book will appear here automatically.
        </p>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div style={{ minHeight: "100vh", background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: "Georgia, serif", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>😔</div>
        <h1 style={{ color: "white", fontSize: 24, margin: "0 0 12px" }}>Something went wrong</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 360, lineHeight: 1.6 }}>
          We hit a snag while creating your book. Our team has been notified and will email you shortly to sort it out.
        </p>
        <a href="mailto:hello@mytinytales.studio" style={{ marginTop: 24, color: GOLD, fontSize: 14 }}>hello@mytinytales.studio</a>
      </div>
    );
  }

  if (!isReady || !data) {
    return (
      <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <Spinner />
      </div>
    );
  }

  // Book ready — full display
  const { story, childName, pageUrls = [], coverUrl, interiorPdfUrl, plan, printApproval } = data;
  const capName = childName ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase() : "You";
  const printPending = plan === "print" && printApproval === "pending";

  return (
    <div style={{ minHeight: "100vh", background: "#07090F", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .spread { animation: fadeIn 0.5s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #07090F, #0E1118)", padding: isMobile ? "28px 20px" : "36px 48px", textAlign: "center", borderBottom: "1px solid rgba(232,192,122,0.1)" }}>
        <p style={{ color: GOLD, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px", opacity: 0.7 }}>My Tiny Tales</p>
        <h1 style={{ color: "white", fontSize: isMobile ? 24 : 32, margin: "0 0 8px", fontWeight: 700 }}>{story?.title || "Your Storybook"}</h1>
        <p style={{ color: "rgba(232,192,122,0.6)", fontSize: 13, margin: 0, fontStyle: "italic" }}>{story?.dedication || `A story starring ${capName}`}</p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          {interiorPdfUrl && (
            <a href={interiorPdfUrl} download target="_blank" rel="noopener noreferrer"
              style={{ padding: "12px 28px", borderRadius: 50, background: "linear-gradient(135deg, #E8C07A, #D4A24C)", color: DARK, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
              ↓ Download PDF
            </a>
          )}
          {plan === "print" && !printPending && (
            <span style={{ padding: "12px 22px", borderRadius: 50, border: "1px solid rgba(232,192,122,0.3)", color: GOLD, fontSize: 13 }}>
              🖨 Print copy on its way
            </span>
          )}
        </div>

        {/* Print review banner — shown until the customer approves */}
        {printPending && (
          <div style={{ maxWidth: 560, margin: "24px auto 0", background: "linear-gradient(135deg, rgba(232,192,122,0.12), rgba(212,162,76,0.08))", border: "1px solid rgba(232,192,122,0.35)", borderRadius: 16, padding: isMobile ? "16px 18px" : "20px 28px", textAlign: "left" }}>
            <p style={{ color: GOLD, fontWeight: 700, fontSize: isMobile ? 15 : 16, margin: "0 0 6px" }}>One last step: review and approve your book</p>
            <p style={{ color: "rgba(245,240,224,0.7)", fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>
              Look through every page below. When you&apos;re happy with how it looks, press the button at the bottom and we&apos;ll send it to print. If you do nothing, it will be sent automatically in 3 days.
            </p>
            <a href="#approve-print" style={{ color: GOLD, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Skip to approval ↓</a>
          </div>
        )}
      </div>

      {/* Cover */}
      {coverUrl && (
        <div style={{ maxWidth: 480, margin: "40px auto 0", padding: "0 20px" }}>
          <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", position: "relative" }}>
            <img src={coverUrl} alt="Book cover" style={{ width: "100%", display: "block" }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent 0%, rgba(8,4,20,0.72) 35%, rgba(8,4,20,0.96) 100%)",
              padding: isMobile ? "48px 20px 22px" : "64px 28px 30px",
            }}>
              <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 6px", opacity: 0.75, fontFamily: "Georgia, serif" }}>My Tiny Tales</p>
              <h2 style={{ color: "white", fontSize: isMobile ? 19 : 23, fontWeight: 700, margin: "0 0 7px", lineHeight: 1.2, fontFamily: "Georgia, 'Times New Roman', serif" }}>{story?.title}</h2>
              <p style={{ color: GOLD, fontSize: 11, fontStyle: "italic", margin: 0, opacity: 0.78, lineHeight: 1.5, fontFamily: "Georgia, serif" }}>{story?.dedication}</p>
            </div>
          </div>
        </div>
      )}

      {/* Story spreads */}
      <div style={{ maxWidth: 900, margin: "40px auto 60px", padding: "0 20px", display: "flex", flexDirection: "column", gap: 32 }}>
        {(story?.pages || []).map((page, i) => {
          const img = pageUrls[i];
          return (
            <div key={i} className="spread" style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "50% 50%",
              gridTemplateRows: isMobile ? "auto auto" : undefined,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
              background: CREAM,
              minHeight: isMobile ? undefined : 420,
              position: "relative",
            }}>
              {/* Gutter shadow */}
              {!isMobile && (
                <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 24, transform: "translateX(-50%)", zIndex: 2, pointerEvents: "none", background: "linear-gradient(to right, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.03) 50%, transparent 100%)" }} />
              )}

              {/* Text page */}
              <div style={{ order: isMobile ? 2 : undefined, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "20px 20px 24px" : "44px 36px 44px 44px", zIndex: 1, background: CREAM }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
                  <div style={{ height: 1, width: 20, background: "rgba(120,80,30,0.35)", flexShrink: 0 }} />
                  <span style={{ color: "rgba(120,80,30,0.65)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Chapter {CHAPTER_NAMES[i] || i + 1}</span>
                </div>
                <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isMobile ? 14 : 15.5, lineHeight: 1.85, color: BROWN, margin: 0 }}>
                  {page.text}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 22 }}>
                  <div style={{ height: 1, width: 30, background: "rgba(120,80,30,0.22)", flexShrink: 0 }} />
                  <span style={{ color: "rgba(120,80,30,0.38)", fontSize: 9, letterSpacing: "0.14em" }}>— {page.pageNum} —</span>
                </div>
              </div>

              {/* Illustration */}
              <div style={{ order: isMobile ? 1 : undefined, position: "relative", height: isMobile ? 260 : undefined, overflow: "hidden", background: "#1a1a2e" }}>
                {img
                  ? <img src={img} alt={`Chapter ${CHAPTER_NAMES[i]}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 260 }}>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid rgba(255,255,255,0.4)", animation: "spin 1s linear infinite" }} />
                    </div>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Approve & Send to Print */}
      {plan === "print" && (
        <div id="approve-print" style={{ maxWidth: 600, margin: "0 auto 60px", padding: "0 20px" }}>
          {printPending && !approving && !approveError && (
            <div style={{ background: "linear-gradient(135deg, rgba(232,192,122,0.12), rgba(212,162,76,0.08))", border: "1px solid rgba(232,192,122,0.35)", borderRadius: 18, padding: isMobile ? "24px 20px" : "32px 36px", textAlign: "center" }}>
              <h2 style={{ color: "white", fontSize: isMobile ? 19 : 22, fontWeight: 700, margin: "0 0 8px" }}>Happy with every page?</h2>
              <p style={{ color: "rgba(245,240,224,0.7)", fontSize: 14, margin: "0 0 20px", lineHeight: 1.7 }}>
                This is exactly how your softcover book will be printed. Press the button to send it to our print partner. Most books arrive within about 1-2 weeks.
              </p>
              <button onClick={() => setShowPrintConfirm(true)} style={{ padding: "15px 36px", borderRadius: 50, border: "none", background: "linear-gradient(135deg, #E8C07A, #D4A24C)", color: DARK, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                Approve &amp; Send to Print →
              </button>
              <p style={{ color: "rgba(245,240,224,0.35)", fontSize: 12, marginTop: 14 }}>Not ready? No rush — we&apos;ll send it automatically in 3 days.</p>
            </div>
          )}

          {approving && (
            <div style={{ background: "rgba(232,192,122,0.08)", border: "1px solid rgba(232,192,122,0.25)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <Spinner size={20} />
              <p style={{ color: "rgba(232,192,122,0.85)", fontSize: 14, margin: 0 }}>Sending your book to print…</p>
            </div>
          )}

          {plan === "print" && !printPending && !approving && (
            <div style={{ background: "rgba(40,200,100,0.08)", border: "1px solid rgba(40,200,100,0.3)", borderRadius: 16, padding: "20px 28px", textAlign: "center" }}>
              <p style={{ color: "rgba(180,255,200,0.95)", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>Your printed book is on its way!</p>
              <p style={{ color: "rgba(180,255,200,0.7)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>Your order is with our print partner. Most books arrive within about 1-2 weeks.</p>
            </div>
          )}

          {approveError && (
            <div style={{ marginTop: 14, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: 14, padding: "16px 22px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,180,180,0.9)", fontSize: 13, margin: "0 0 10px", lineHeight: 1.6 }}>{approveError}</p>
              <button onClick={() => setApproveError(null)} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "rgba(232,192,122,0.2)", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Try again</button>
            </div>
          )}
        </div>
      )}

      {/* Send-to-print confirmation modal */}
      {showPrintConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(6px)" }} onClick={() => setShowPrintConfirm(false)}>
          <div style={{ background: "#0E1118", border: "1px solid rgba(232,192,122,0.3)", borderRadius: 20, padding: isMobile ? "28px 24px" : "36px 40px", maxWidth: 460, width: "100%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,192,122,0.12)", border: "1px solid rgba(232,192,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </div>
            <h2 style={{ color: "#F5F0E0", fontSize: 22, fontWeight: 700, margin: "0 0 12px" }}>Send to print?</h2>
            <p style={{ color: "rgba(245,240,224,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 28px" }}>
              Once confirmed, your book goes to our print partner and can&apos;t be changed. Make sure every page looks exactly how you want it.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowPrintConfirm(false)} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(245,240,224,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Go back</button>
              <button onClick={approvePrint} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #E8C07A, #D4A24C)", color: DARK, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Yes, send to print →</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ background: DARK, padding: "40px 24px", textAlign: "center" }}>
        <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 10px", opacity: 0.6 }}>My Tiny Tales</p>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>© {new Date().getFullYear()} My Tiny Tales · <a href="https://mytinytales.studio" style={{ color: "rgba(255,255,255,0.35)" }}>mytinytales.studio</a></p>
      </div>
    </div>
  );
}
