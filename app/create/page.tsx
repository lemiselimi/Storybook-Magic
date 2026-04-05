"use client";
import { useState, useRef, useCallback, useEffect } from "react";

const THEMES = [
  { id: "adventure", label: "🗺️ Adventure", desc: "Epic quests & exploration" },
  { id: "animals", label: "🦁 Animal Friends", desc: "Talking creatures & wild places" },
  { id: "space", label: "🚀 Space Explorer", desc: "Stars, planets & galaxies" },
  { id: "magic", label: "✨ Magic Kingdom", desc: "Spells, fairies & enchantment" },
  { id: "ocean", label: "🐠 Under the Sea", desc: "Mermaids & ocean mysteries" },
  { id: "dinosaurs", label: "🦕 Dino World", desc: "Prehistoric adventures" },
];

const PAGE_BACKGROUNDS = [
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

const PAYMENTS_ENABLED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const BOOK_PRICE = process.env.NEXT_PUBLIC_BOOK_PRICE || "$4.99";

// Encode/decode story data for share URLs (handles unicode)
const encodeShare = (data: object) => btoa(unescape(encodeURIComponent(JSON.stringify(data))));
const decodeShare = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))));
const rawFalUrl = (proxyUrl: string) => {
  try { return decodeURIComponent(proxyUrl.replace("/api/proxy?url=", "")); }
  catch { return proxyUrl; }
};

export default function StorybookCreator() {
  const [step, setStep] = useState("upload");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [cartoonUrl, setCartoonUrl] = useState<string | null>(null);
  const [photoFalUrl, setPhotoFalUrl] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [scenesGenerating, setScenesGenerating] = useState(false);
  const [scenesCompleted, setScenesCompleted] = useState(0);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childGender, setChildGender] = useState("boy");
  const [theme, setTheme] = useState("adventure");
  const [story, setStory] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(-1);
  const [navDir, setNavDir] = useState<"fwd" | "back">("fwd");
  const [falError, setFalError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSharedView, setIsSharedView] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 680);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Handle Stripe return + share link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState({}, "", "/");

    // Share link
    const share = params.get("share");
    if (share) {
      try {
        const data = decodeShare(share);
        setStory(data.story);
        if (data.cartoonFalUrl) setCartoonUrl(`/api/proxy?url=${encodeURIComponent(data.cartoonFalUrl)}`);
        setPageImages((data.pageFalUrls || []).map((u: string | null) =>
          u ? `/api/proxy?url=${encodeURIComponent(u)}` : null
        ));
        setIsSharedView(true);
        setCurrentPage(-1);
        setStep("book");
      } catch (e) { console.error("Invalid share link", e); }
      return;
    }

    // Stripe return
    const success = params.get("success");
    const sessionId = params.get("session_id");
    const ref = params.get("ref");
    if (success && sessionId && ref) {
      const saved = sessionStorage.getItem(ref);
      if (!saved) return;
      sessionStorage.removeItem(ref);
      const data = JSON.parse(saved);
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(r => r.json())
        .then(result => {
          if (result.ok) {
            if (data.photoBase64) { setPhoto(`data:image/jpeg;base64,${data.photoBase64}`); setPhotoBase64(data.photoBase64); }
            setChildName(data.childName || ""); setChildAge(data.childAge || "");
            setChildGender(data.childGender || "boy"); setTheme(data.theme || "adventure");
            setTimeout(() => generateBookWith(data), 50);
          }
        }).catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
      };
      img.onerror = reject;
      img.src = objectUrl;
    });

  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhoto(URL.createObjectURL(file));
    setCartoonUrl(null); setFalError(null);
    compressImage(file).then(setPhotoBase64).catch(() => {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoBase64((e.target?.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const getFallbackStory = (name = childName) => ({
    title: `${name || "A Child"}'s Big Adventure`,
    dedication: `For ${name || "every child"} who dares to dream`,
    pages: [
      { pageNum: 1, text: `Once upon a time, ${name || "our hero"} woke up to find a magical map under their pillow.`, illustration: `A cozy bedroom at dawn, the child sitting up in bed holding a glowing treasure map that pulses with golden light, moonbeams streaming through the curtains, floating sparkles in the air` },
      { pageNum: 2, text: `${name || "Our hero"} packed a backpack and set off into the forest. "I'm ready!" they cheered.`, illustration: `A child in explorer gear with a colorful backpack standing at the edge of a glowing enchanted forest at golden hour, tall magical trees arching overhead, fireflies dancing in the warm light` },
      { pageNum: 3, text: `The path led through an enchanted forest full of friendly butterflies and glowing flowers.`, illustration: `Inside a magical glowing forest, the child walking along a winding path, giant luminous mushrooms and rainbow butterflies surrounding them, shafts of golden light filtering through the canopy` },
      { pageNum: 4, text: `Deep in the forest they found a tiny dragon who had lost his fire.`, illustration: `A clearing in the enchanted forest, the child kneeling beside a small blue dragon with droopy wings and sad eyes, surrounded by unlit candles and cold embers, soft misty light` },
      { pageNum: 5, text: `${name || "Our hero"} told a joke and WHOOOOSH bright flames burst out! "You fixed me!" the dragon cried.`, illustration: `The child and a small dragon in a magical forest clearing, the dragon joyfully breathing a spectacular rainbow flame into the sky while the child laughs and claps, sparks and colorful lights everywhere` },
      { pageNum: 6, text: `The dragon flew them home under the stars. "Best day ever," they whispered.`, illustration: `A child riding on the back of a friendly glowing dragon soaring through a spectacular star-filled night sky, a cozy village visible far below, northern lights swirling around them in purples and greens` },
    ],
  });

  const generateScenes = async (falUrl: string, pages: any[], gender: string, name: string) => {
    setScenesGenerating(true); setScenesCompleted(0);
    const promises = pages.map(async (page, idx) => {
      try {
        const res = await fetch("/api/generate-scene", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: falUrl, illustration: page.illustration, childName: name, gender }),
        }).then(r => r.json());
        if (res.url) {
          setPageImages(prev => { const n = [...prev]; n[idx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; });
          setScenesCompleted(p => p + 1);
        }
      } catch { setScenesCompleted(p => p + 1); }
    });
    await Promise.allSettled(promises);
    setScenesGenerating(false);
  };

  const generateBookWith = async (params?: any) => {
    const _base64 = params?.photoBase64 ?? photoBase64;
    const _name = params?.childName ?? childName;
    const _age = params?.childAge ?? childAge;
    const _gender = params?.childGender ?? childGender;
    const _theme = params?.theme ?? theme;
    setStep("generating"); setFalError(null); setPageImages(Array(6).fill(null)); setPhotoFalUrl(null); setIsSharedView(false);
    try {
      setLoadingMsg("Transforming photo & writing your story... 🎨📖");
      const selectedTheme = THEMES.find(t => t.id === _theme);
      const [cartoonRes, storyRes] = await Promise.allSettled([
        fetch("/api/cartoonify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: _base64, gender: _gender }) }).then(r => r.json()),
        fetch("/api/story", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ childName: _name, childAge: _age, gender: _gender, theme: `${selectedTheme?.label} - ${selectedTheme?.desc}` }) }).then(r => r.json()),
      ]);
      let falUrl: string | null = null;
      if (cartoonRes.status === "fulfilled" && cartoonRes.value?.url) {
        setCartoonUrl(`/api/proxy?url=${encodeURIComponent(cartoonRes.value.url)}`);
        falUrl = cartoonRes.value.url; setPhotoFalUrl(falUrl);
      } else { setFalError("Cartoon transformation failed — using original photo."); }
      const storyData = storyRes.status === "fulfilled" ? storyRes.value : getFallbackStory(_name);
      setStory(storyData);
      if (falUrl && storyData?.pages) {
        setLoadingMsg("Painting your scenes... 🎨 (this takes ~1 min)");
        await generateScenes(falUrl, storyData.pages, _gender, _name);
      }
      setCurrentPage(-1); setStep("book");
    } catch (err) {
      console.error(err);
      setStory(getFallbackStory(_name)); setCurrentPage(-1); setStep("book");
    }
  };

  const handleCreateClick = async () => {
    if (!PAYMENTS_ENABLED) { generateBookWith(); return; }
    setCheckoutLoading(true);
    try {
      const ref = crypto.randomUUID();
      sessionStorage.setItem(ref, JSON.stringify({ photoBase64, childName, childAge, childGender, theme }));
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref }) }).then(r => r.json());
      if (res.url) window.location.href = res.url;
      else throw new Error(res.error || "Checkout failed");
    } catch (err: any) {
      alert("Payment setup failed: " + err.message);
      setCheckoutLoading(false);
    }
  };

  const navigate = (newPage: number) => {
    setNavDir(newPage > currentPage ? "fwd" : "back");
    setCurrentPage(newPage);
  };

  const regenerateScene = async (pageIdx: number) => {
    if (!photoFalUrl || regeneratingPage !== null) return;
    setRegeneratingPage(pageIdx);
    try {
      const page = story.pages[pageIdx];
      const res = await fetch("/api/generate-scene", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: photoFalUrl, illustration: page.illustration, childName, gender: childGender }),
      }).then(r => r.json());
      if (res.url) {
        setPageImages(prev => { const n = [...prev]; n[pageIdx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; });
      }
    } catch (err) { console.error("Regenerate failed:", err); }
    setRegeneratingPage(null);
  };

  const copyShareLink = async () => {
    if (!story) return;
    const data = {
      story,
      cartoonFalUrl: cartoonUrl ? rawFalUrl(cartoonUrl) : null,
      pageFalUrls: pageImages.map(u => u ? rawFalUrl(u) : null),
    };
    const url = `${window.location.origin}/create?share=${encodeShare(data)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch { /* fallback */ }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = 297, pdfH = 210;
      const capture = async (id: string) => {
        const el = document.getElementById(id);
        return el ? html2canvas(el, { useCORS: true, scale: 2, backgroundColor: null }) : null;
      };
      const coverCanvas = await capture("pdf-cover-capture");
      if (coverCanvas) pdf.addImage(coverCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfW, pdfH);
      for (let i = 0; i < story.pages.length; i++) {
        const canvas = await capture(`pdf-spread-${i}`);
        if (canvas) { pdf.addPage("a4", "landscape"); pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfW, pdfH); }
      }
      pdf.save(`${(story.title || "StoryBook").replace(/[^a-z0-9]/gi, "_")}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("PDF generation failed. Please try again.");
    }
    setPdfLoading(false);
  };

  const resetAll = () => {
    setStep("upload"); setPhoto(null); setCartoonUrl(null); setStory(null);
    setPageImages(Array(6).fill(null)); setPhotoFalUrl(null); setScenesGenerating(false);
    setChildGender("boy"); setIsSharedView(false); setRegeneratingPage(null);
  };

  const displayPhoto = cartoonUrl || photo;
  const totalPages = story?.pages?.length ?? 6;

  // ── BookPage ────────────────────────────────────────────────────────────────
  const BookPage = ({ page, isLeft, isLast }: { page: any; isLeft: boolean; isLast?: boolean }) => {
    const bg = PAGE_BACKGROUNDS[(page.pageNum - 1) % PAGE_BACKGROUNDS.length];
    const sceneImage = pageImages[page.pageNum - 1];
    const isRegenerating = regeneratingPage === page.pageNum - 1;

    if (isLeft) return (
      <div style={{ flex: 1, padding: isMobile ? "16px 16px 8px" : "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fffef7", borderBottom: isMobile ? "2px solid #e8dcc8" : "none" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="scene-wrap" style={{ width: "100%", aspectRatio: "4/3", borderRadius: 14, overflow: "hidden", background: sceneImage ? "#1a1a2e" : bg, border: "3px solid rgba(255,255,255,0.5)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            {isRegenerating ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, border: "3px solid rgba(255,215,0,0.3)", borderTop: "3px solid #ffd700", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Repainting scene...</span>
              </div>
            ) : sceneImage ? (
              <img crossOrigin="anonymous" src={sceneImage} alt={`Page ${page.pageNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : displayPhoto ? (
              <img crossOrigin="anonymous" src={displayPhoto} alt="hero" style={{ height: "85%", width: "auto", maxWidth: "70%", objectFit: "contain", borderRadius: 12, filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))" }} />
            ) : null}
            {/* Regenerate button — only in live (non-shared) sessions */}
            {!isSharedView && photoFalUrl && !isRegenerating && (
              <button className="regen-btn" onClick={() => regenerateScene(page.pageNum - 1)} title="Regenerate this scene" style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 8px", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>🔄 Redo</button>
            )}
            {/* Badge */}
            {sceneImage && !isRegenerating
              ? <div style={{ position: "absolute", top: 8, right: 8, borderRadius: 8, background: "rgba(255,215,0,0.95)", padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ AI Scene</div>
              : cartoonUrl && !isRegenerating ? <div style={{ position: "absolute", top: 8, right: 8, borderRadius: 8, background: "rgba(255,215,0,0.95)", padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ Pixar Style</div>
              : null}
          </div>
        </div>
        {!isMobile && <div style={{ textAlign: "center", color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 13, marginTop: 10 }}>— {page.pageNum} —</div>}
      </div>
    );

    return (
      <div style={{ flex: 1, padding: isMobile ? "12px 16px 20px" : "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fff8f0" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 15 : 17, lineHeight: 1.85, color: "#3d2b1f", margin: 0 }}>{page.text}</p>
          {isLast && <p style={{ fontFamily: "Georgia, serif", fontSize: 18, color: "#c4a882", fontStyle: "italic", marginTop: 24, textAlign: "center" }}>The End 🌟</p>}
        </div>
        <div style={{ textAlign: "center", color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 13, marginTop: 10 }}>— {page.pageNum} —</div>
      </div>
    );
  };

  // ── BookSpread ───────────────────────────────────────────────────────────────
  const BookSpread = ({ spreadIndex }: { spreadIndex: number }) => {
    const page = story.pages[spreadIndex];
    const isLast = spreadIndex === story.pages.length - 1;
    if (!page) return null;
    return isMobile ? (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <BookPage page={page} isLeft={true} />
        <BookPage page={page} isLeft={false} isLast={isLast} />
      </div>
    ) : (
      <div style={{ display: "flex", width: "100%", minHeight: 380 }}>
        <BookPage page={page} isLeft={true} />
        <div style={{ width: 6, flexShrink: 0, background: "linear-gradient(to right, #d4c4a8, #e8dcc8, #d4c4a8)", boxShadow: "inset -2px 0 4px rgba(0,0,0,0.06), inset 2px 0 4px rgba(0,0,0,0.06)" }} />
        <BookPage page={page} isLeft={false} isLast={isLast} />
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 40%, #1a3a2e 100%)", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: isMobile ? "20px 12px" : "32px 16px" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes slideInFwd { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInBack { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        input::placeholder{color:rgba(255,255,255,0.25);}
        input:focus{border-color:rgba(255,215,0,0.5)!important;outline:none;}
        .scene-wrap .regen-btn{opacity:0;transition:opacity 0.2s;}
        .scene-wrap:hover .regen-btn{opacity:1;}
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: isMobile ? 18 : 28, animation: "fadeUp 0.6s ease both" }}>
        <div style={{ fontSize: isMobile ? 36 : 46, marginBottom: 6, animation: "float 3s ease-in-out infinite" }}>📚</div>
        <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 34, fontWeight: 800, background: "linear-gradient(90deg, #ffd700, #ff9a9e, #a18cd1, #ffd700)", backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s ease infinite" }}>StoryBook Magic</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "6px 0 0", fontSize: 13 }}>Turn your child's photo into a Pixar-style adventure</p>
      </div>

      {/* ── Upload ── */}
      {step === "upload" && (
        <div style={{ width: "100%", maxWidth: 540, animation: "fadeUp 0.5s ease both" }}>
          <div onClick={() => fileRef.current?.click()} onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            style={{ background: dragOver ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.04)", border: `2px dashed ${dragOver ? "#ffd700" : "rgba(255,255,255,0.18)"}`, borderRadius: 24, padding: isMobile ? "40px 24px" : "56px 40px", textAlign: "center", cursor: "pointer" }}>
            {photo ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <img src={photo} alt="preview" style={{ width: 130, height: 130, objectFit: "cover", borderRadius: "50%", border: "4px solid #ffd700" }} />
                <p style={{ color: "#ffd700", fontWeight: 600, margin: 0 }}>✓ Photo ready! Tap to change</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🧒</div>
                <p style={{ color: "white", fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>Drop your child's photo here</p>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0 }}>or tap to browse</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {photo && <button onClick={() => setStep("customize")} style={{ width: "100%", marginTop: 16, padding: "15px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Continue to Customize →</button>}
        </div>
      )}

      {/* ── Customize ── */}
      {step === "customize" && (
        <div style={{ width: "100%", maxWidth: 620, animation: "fadeUp 0.5s ease both" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 24, padding: isMobile ? 18 : 28, border: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>CHILD'S NAME</label>
                <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Emma, Liam..." style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, boxSizing: "border-box" }} />
              </div>
              <div style={{ width: 74 }}>
                <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>AGE</label>
                <input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="5" type="number" style={{ width: "100%", padding: "11px 12px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, boxSizing: "border-box" }} />
              </div>
            </div>
            <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 9 }}>GENDER</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[{ id: "boy", label: "👦 Boy" }, { id: "girl", label: "👧 Girl" }, { id: "neutral", label: "🧒 Neutral" }].map(g => (
                <div key={g.id} onClick={() => setChildGender(g.id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 11, cursor: "pointer", textAlign: "center", border: `1px solid ${childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.09)"}`, background: childGender === g.id ? "rgba(255,215,0,0.11)" : "rgba(255,255,255,0.03)", fontWeight: 600, color: childGender === g.id ? "#ffd700" : "white", fontSize: 13 }}>{g.label}</div>
              ))}
            </div>
            <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 9 }}>STORY THEME</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {THEMES.map((t) => (
                <div key={t.id} onClick={() => setTheme(t.id)} style={{ padding: "10px 13px", borderRadius: 11, cursor: "pointer", border: `1px solid ${theme === t.id ? "#ffd700" : "rgba(255,255,255,0.09)"}`, background: theme === t.id ? "rgba(255,215,0,0.11)" : "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontWeight: 600, color: theme === t.id ? "#ffd700" : "white", fontSize: 13 }}>{t.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {["🎨 AI Pixar art", "📖 6 unique scenes", "📥 PDF download", "🔗 Shareable link"].map(v => (
              <span key={v} style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.18)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "rgba(255,215,0,0.8)" }}>{v}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={() => setStep("upload")} style={{ padding: "13px 20px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.13)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>← Back</button>
            <button onClick={handleCreateClick} disabled={checkoutLoading} style={{ flex: 1, padding: "15px", borderRadius: 13, border: "none", background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", color: "white", fontSize: 16, fontWeight: 700, cursor: checkoutLoading ? "not-allowed" : "pointer", opacity: checkoutLoading ? 0.7 : 1 }}>
              {checkoutLoading ? "Redirecting..." : PAYMENTS_ENABLED ? `✨ Create My Storybook — ${BOOK_PRICE}` : "✨ Create My Storybook!"}
            </button>
          </div>
        </div>
      )}

      {/* ── Generating ── */}
      {step === "generating" && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both", maxWidth: 400, width: "100%", padding: "0 16px" }}>
          <div style={{ fontSize: 72, marginBottom: 20, animation: "float 2s ease-in-out infinite" }}>🪄</div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Creating your magical book...</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 8px" }}>{loadingMsg}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 20px" }}>Transforming photo, writing story & painting all scenes — about 1–2 minutes!</p>
          {scenesCompleted > 0 && (
            <div style={{ width: "100%", maxWidth: 260, margin: "0 auto 20px" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #ffd700, #ff9a9e)", width: `${(scenesCompleted / totalPages) * 100}%`, transition: "width 0.4s ease" }} />
              </div>
              <p style={{ color: "rgba(255,215,0,0.7)", fontSize: 12, marginTop: 7 }}>{scenesCompleted} of {totalPages} scenes painted</p>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "float 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      )}

      {/* ── Book ── */}
      {step === "book" && story && (
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 880, animation: "fadeUp 0.5s ease both" }}>
          {falError && <div style={{ background: "rgba(255,100,100,0.09)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: 10, padding: "9px 14px", marginBottom: 12, color: "#ffaaaa", fontSize: 13, textAlign: "center" }}>⚠️ {falError}</div>}
          {isSharedView && <div style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, color: "rgba(255,215,0,0.8)", fontSize: 13, textAlign: "center" }}>📖 Viewing a shared storybook</div>}

          {/* Book display */}
          {currentPage === -1 ? (
            <div style={{ background: "linear-gradient(135deg, #2d1b4e, #4a2060)", borderRadius: 20, padding: isMobile ? "40px 24px" : "56px 40px", textAlign: "center", border: "2px solid rgba(255,215,0,0.28)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", animation: "fadeUp 0.4s ease both" }}>
              {displayPhoto && <img crossOrigin="anonymous" src={displayPhoto} alt="hero" style={{ width: isMobile ? 120 : 148, height: isMobile ? 120 : 148, objectFit: "cover", borderRadius: 16, border: "5px solid #ffd700", marginBottom: 18 }} />}
              {cartoonUrl && <div style={{ marginBottom: 12 }}><span style={{ background: "rgba(255,215,0,0.18)", border: "1px solid rgba(255,215,0,0.35)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#ffd700", fontWeight: 600 }}>✨ Pixar-style cartoon</span></div>}
              <h1 style={{ color: "#ffd700", fontSize: isMobile ? 22 : 30, fontWeight: 800, margin: "0 0 10px" }}>{story.title}</h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontStyle: "italic", fontSize: 14, margin: "0 0 22px" }}>{story.dedication}</p>
              <button onClick={() => navigate(0)} style={{ padding: "11px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Open Book →</button>
            </div>
          ) : (
            <div key={`spread-${currentPage}`} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", animation: `${navDir === "fwd" ? "slideInFwd" : "slideInBack"} 0.25s ease both` }}>
              <BookSpread spreadIndex={currentPage} />
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 10 : 16, marginTop: 18 }}>
            <button onClick={() => navigate(Math.max(-1, currentPage - 1))} disabled={currentPage === -1}
              style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 14, cursor: currentPage === -1 ? "not-allowed" : "pointer", opacity: currentPage === -1 ? 0.3 : 1 }}>← Prev</button>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div onClick={() => navigate(-1)} title="Cover" style={{ width: currentPage === -1 ? 10 : 7, height: currentPage === -1 ? 10 : 7, borderRadius: "50%", background: currentPage === -1 ? "#ffd700" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s" }} />
              {story.pages.map((_: any, i: number) => (
                <div key={i} onClick={() => navigate(i)} style={{ width: currentPage === i ? 10 : 7, height: currentPage === i ? 10 : 7, borderRadius: "50%", background: currentPage === i ? "#ffd700" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
            <button onClick={() => navigate(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}
              style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 14, fontWeight: 600, cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer", opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}>Next →</button>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={downloadPDF} disabled={pdfLoading} style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: pdfLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #43e97b, #38f9d7)", color: pdfLoading ? "rgba(255,255,255,0.4)" : "#1a2e1a", fontSize: 13, fontWeight: 700, cursor: pdfLoading ? "not-allowed" : "pointer" }}>
              {pdfLoading ? "⏳ Generating..." : "📥 Download PDF"}
            </button>
            <button onClick={copyShareLink} style={{ padding: "10px 20px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: shareCopied ? "linear-gradient(135deg, #667eea, #764ba2)" : "rgba(255,255,255,0.1)", color: shareCopied ? "white" : "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}>
              {shareCopied ? "✓ Link Copied!" : "🔗 Share Book"}
            </button>
            <button onClick={resetAll} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>+ New Book</button>
          </div>
        </div>
      )}

      {/* Off-screen PDF targets */}
      {step === "book" && story && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, width: 880, pointerEvents: "none" }} aria-hidden="true">
          <div id="pdf-cover-capture" style={{ width: 880, height: 520, background: "linear-gradient(135deg, #2d1b4e, #4a2060)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
            {displayPhoto && <img crossOrigin="anonymous" src={displayPhoto} alt="hero" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 20, border: "5px solid #ffd700" }} />}
            <div style={{ color: "#ffd700", fontSize: 32, fontWeight: 800, textAlign: "center" }}>{story.title}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontStyle: "italic", fontSize: 16, textAlign: "center" }}>{story.dedication}</div>
          </div>
          {story.pages.map((_: any, i: number) => (
            <div key={i} id={`pdf-spread-${i}`} style={{ width: 880, background: "white", display: "flex" }}>
              <BookSpread spreadIndex={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
