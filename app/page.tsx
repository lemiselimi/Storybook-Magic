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

export default function StorybookCreator() {
  const [step, setStep] = useState("upload");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [cartoonUrl, setCartoonUrl] = useState<string | null>(null);
  const [photoFalUrl, setPhotoFalUrl] = useState<string | null>(null);
  const [pageImages, setPageImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [scenesGenerating, setScenesGenerating] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childGender, setChildGender] = useState("boy");
  const [theme, setTheme] = useState("adventure");
  const [story, setStory] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(-1);
  const [falError, setFalError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Handle Stripe return: ?success=1&session_id=xxx&ref=uuid or ?cancelled=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const sessionId = params.get("session_id");
    const ref = params.get("ref");
    const cancelled = params.get("cancelled");
    window.history.replaceState({}, "", "/");

    if (cancelled) return; // user cancelled — stay on upload step

    if (success && sessionId && ref) {
      const saved = sessionStorage.getItem(ref);
      if (!saved) return;
      sessionStorage.removeItem(ref);
      const data = JSON.parse(saved);

      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(r => r.json())
        .then(result => {
          if (result.ok) {
            // Restore photo preview
            if (data.photoBase64) {
              setPhoto(`data:image/jpeg;base64,${data.photoBase64}`);
              setPhotoBase64(data.photoBase64);
            }
            setChildName(data.childName || "");
            setChildAge(data.childAge || "");
            setChildGender(data.childGender || "boy");
            setTheme(data.theme || "adventure");
            // generateBook reads from state, so call it after a tick
            setTimeout(() => generateBookWith(data), 50);
          }
        })
        .catch(console.error);
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
        canvas.width = width;
        canvas.height = height;
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
    setCartoonUrl(null);
    setFalError(null);
    compressImage(file).then(setPhotoBase64).catch(() => {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoBase64((e.target?.result as string).split(",")[1]);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
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
    setScenesGenerating(true);
    const scenePromises = pages.map(async (page, idx) => {
      try {
        const res = await fetch("/api/generate-scene", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: falUrl, illustration: page.illustration, childName: name, gender }),
        }).then(r => r.json());
        if (res.url) {
          setPageImages(prev => {
            const next = [...prev];
            next[idx] = `/api/proxy?url=${encodeURIComponent(res.url)}`;
            return next;
          });
        }
      } catch (err) {
        console.error(`Scene generation failed for page ${idx + 1}:`, err);
      }
    });
    await Promise.allSettled(scenePromises);
    setScenesGenerating(false);
  };

  // Core generation — accepts explicit params (for post-Stripe flow) or reads from state
  const generateBookWith = async (params?: { photoBase64: string; childName: string; childAge: string; childGender: string; theme: string }) => {
    const _base64 = params?.photoBase64 ?? photoBase64;
    const _name = params?.childName ?? childName;
    const _age = params?.childAge ?? childAge;
    const _gender = params?.childGender ?? childGender;
    const _theme = params?.theme ?? theme;

    setStep("generating");
    setFalError(null);
    setPageImages(Array(6).fill(null));
    setPhotoFalUrl(null);

    try {
      setLoadingMsg("Transforming photo & writing your story... 🎨📖");
      const selectedTheme = THEMES.find(t => t.id === _theme);

      const [cartoonRes, storyRes] = await Promise.allSettled([
        fetch("/api/cartoonify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: _base64, gender: _gender }),
        }).then(r => r.json()),
        fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childName: _name, childAge: _age, gender: _gender, theme: `${selectedTheme?.label} - ${selectedTheme?.desc}` }),
        }).then(r => r.json()),
      ]);

      let falUrl: string | null = null;
      if (cartoonRes.status === "fulfilled" && cartoonRes.value?.url) {
        setCartoonUrl(`/api/proxy?url=${encodeURIComponent(cartoonRes.value.url)}`);
        falUrl = cartoonRes.value.url;
        setPhotoFalUrl(falUrl);
      } else {
        setFalError("Cartoon transformation failed — using original photo.");
      }

      const storyData = storyRes.status === "fulfilled" ? storyRes.value : getFallbackStory(_name);
      setStory(storyData);

      if (falUrl && storyData?.pages) {
        setLoadingMsg("Painting your scenes... 🎨 (this takes ~1 min)");
        await generateScenes(falUrl, storyData.pages, _gender, _name);
      }

      setCurrentPage(-1);
      setStep("book");
    } catch (err) {
      console.error(err);
      setStory(getFallbackStory(_name));
      setCurrentPage(-1);
      setStep("book");
    }
  };

  const handleCreateClick = async () => {
    if (!PAYMENTS_ENABLED) {
      generateBookWith();
      return;
    }
    setCheckoutLoading(true);
    try {
      const ref = crypto.randomUUID();
      sessionStorage.setItem(ref, JSON.stringify({ photoBase64, childName, childAge, childGender, theme }));
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref }),
      }).then(r => r.json());
      if (res.url) window.location.href = res.url;
      else throw new Error(res.error || "Checkout failed");
    } catch (err: any) {
      alert("Payment setup failed: " + err.message);
      setCheckoutLoading(false);
    }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // A4 landscape in mm
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pdfW = 297, pdfH = 210;

      const capture = async (id: string) => {
        const el = document.getElementById(id);
        if (!el) return null;
        return html2canvas(el, { useCORS: true, scale: 2, backgroundColor: null });
      };

      // Cover
      const coverCanvas = await capture("pdf-cover-capture");
      if (coverCanvas) {
        pdf.addImage(coverCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfW, pdfH);
      }

      // Spreads
      const numSpreads = Math.ceil(story.pages.length / 2);
      for (let i = 0; i < numSpreads; i++) {
        const canvas = await capture(`pdf-spread-${i}`);
        if (canvas) {
          pdf.addPage("a4", "landscape");
          pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdfW, pdfH);
        }
      }

      pdf.save(`${(story.title || "StoryBook").replace(/[^a-z0-9]/gi, "_")}.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
      alert("PDF generation failed. Please try again.");
    }
    setPdfLoading(false);
  };

  const displayPhoto = cartoonUrl || photo;

  const BookSpread = ({ spreadIndex }: { spreadIndex: number }) => {
    const leftPage = story.pages[spreadIndex * 2];
    const rightPage = story.pages[spreadIndex * 2 + 1];
    return (
      <div style={{ display: "flex", width: "100%", minHeight: 380 }}>
        {leftPage && <BookPage page={leftPage} isLeft={true} />}
        {rightPage
          ? <BookPage page={rightPage} isLeft={false} />
          : <div style={{ flex: 1, background: "#fff8f0", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 20, fontStyle: "italic" }}>The End 🌟</p></div>
        }
      </div>
    );
  };

  const BookPage = ({ page, isLeft }: { page: any; isLeft: boolean }) => {
    const bg = PAGE_BACKGROUNDS[(page.pageNum - 1) % PAGE_BACKGROUNDS.length];
    const sceneImage = pageImages[page.pageNum - 1];

    return (
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: isLeft ? "#fffef7" : "#fff8f0", borderRight: isLeft ? "2px solid #e8dcc8" : "none" }}>
        {isLeft ? (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 14, overflow: "hidden", background: sceneImage ? "#1a1a2e" : bg, border: "3px solid rgba(255,255,255,0.5)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
                {sceneImage ? (
                  <img crossOrigin="anonymous" src={sceneImage} alt={`Page ${page.pageNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : displayPhoto ? (
                  <img crossOrigin="anonymous" src={displayPhoto} alt="hero" style={{ height: "85%", width: "auto", maxWidth: "70%", objectFit: "contain", borderRadius: 12, filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))" }} />
                ) : null}
                {sceneImage
                  ? <div style={{ position: "absolute", top: 8, right: 8, borderRadius: 8, background: "rgba(255,215,0,0.95)", padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ AI Scene</div>
                  : cartoonUrl ? <div style={{ position: "absolute", top: 8, right: 8, borderRadius: 8, background: "rgba(255,215,0,0.95)", padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ Pixar Style</div>
                  : null}
              </div>
            </div>
            <div style={{ textAlign: "center", color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 13, marginTop: 10 }}>— {page.pageNum} —</div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.85, color: "#3d2b1f", margin: 0 }}>{page.text}</p>
            </div>
            <div style={{ textAlign: "center", color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 13, marginTop: 10 }}>— {page.pageNum + 1} —</div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 40%, #1a3a2e 100%)", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(255,215,0,0.5) !important; outline: none; }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 28, animation: "fadeUp 0.6s ease both" }}>
        <div style={{ fontSize: 46, marginBottom: 6, animation: "float 3s ease-in-out infinite" }}>📚</div>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800, background: "linear-gradient(90deg, #ffd700, #ff9a9e, #a18cd1, #ffd700)", backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s ease infinite" }}>StoryBook Magic</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "6px 0 0", fontSize: 14 }}>Turn your child's photo into a Pixar-style adventure</p>
      </div>

      {step === "upload" && (
        <div style={{ width: "100%", maxWidth: 540, animation: "fadeUp 0.5s ease both" }}>
          <div onClick={() => fileRef.current?.click()} onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} style={{ background: dragOver ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.04)", border: `2px dashed ${dragOver ? "#ffd700" : "rgba(255,255,255,0.18)"}`, borderRadius: 24, padding: "56px 40px", textAlign: "center", cursor: "pointer" }}>
            {photo ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <img src={photo} alt="preview" style={{ width: 150, height: 150, objectFit: "cover", borderRadius: "50%", border: "4px solid #ffd700" }} />
                <p style={{ color: "#ffd700", fontWeight: 600, margin: 0 }}>✓ Photo ready! Click to change</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 60, marginBottom: 14 }}>🧒</div>
                <p style={{ color: "white", fontSize: 17, fontWeight: 600, margin: "0 0 8px" }}>Drop your child's photo here</p>
                <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0 }}>or click to browse</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {photo && <button onClick={() => setStep("customize")} style={{ width: "100%", marginTop: 18, padding: "15px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Continue to Customize →</button>}
        </div>
      )}

      {step === "customize" && (
        <div style={{ width: "100%", maxWidth: 620, animation: "fadeUp 0.5s ease both" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 24, padding: 28, border: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>CHILD'S NAME</label>
                <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Emma, Liam..." style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, boxSizing: "border-box" }} />
              </div>
              <div style={{ width: 80 }}>
                <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>AGE</label>
                <input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="5" type="number" style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, boxSizing: "border-box" }} />
              </div>
            </div>
            <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 10 }}>GENDER</label>
            <div style={{ display: "flex", gap: 9, marginBottom: 24 }}>
              {[{ id: "boy", label: "👦 Boy" }, { id: "girl", label: "👧 Girl" }, { id: "neutral", label: "🧒 Neutral" }].map(g => (
                <div key={g.id} onClick={() => setChildGender(g.id)} style={{ flex: 1, padding: "11px 14px", borderRadius: 11, cursor: "pointer", textAlign: "center", border: `1px solid ${childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.09)"}`, background: childGender === g.id ? "rgba(255,215,0,0.11)" : "rgba(255,255,255,0.03)", fontWeight: 600, color: childGender === g.id ? "#ffd700" : "white", fontSize: 13 }}>{g.label}</div>
              ))}
            </div>
            <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 10 }}>STORY THEME</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {THEMES.map((t) => (
                <div key={t.id} onClick={() => setTheme(t.id)} style={{ padding: "11px 14px", borderRadius: 11, cursor: "pointer", border: `1px solid ${theme === t.id ? "#ffd700" : "rgba(255,255,255,0.09)"}`, background: theme === t.id ? "rgba(255,215,0,0.11)" : "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontWeight: 600, color: theme === t.id ? "#ffd700" : "white", fontSize: 13 }}>{t.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Value props */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
            {["🎨 AI Pixar art", "📖 6 unique scenes", "📥 PDF download"].map(v => (
              <span key={v} style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.18)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "rgba(255,215,0,0.8)" }}>{v}</span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <button onClick={() => setStep("upload")} style={{ padding: "13px 22px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.13)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>← Back</button>
            <button onClick={handleCreateClick} disabled={checkoutLoading} style={{ flex: 1, padding: "15px", borderRadius: 13, border: "none", background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", color: "white", fontSize: 16, fontWeight: 700, cursor: checkoutLoading ? "not-allowed" : "pointer", opacity: checkoutLoading ? 0.7 : 1 }}>
              {checkoutLoading ? "Redirecting to checkout..." : PAYMENTS_ENABLED ? `✨ Create My Storybook — ${BOOK_PRICE}` : "✨ Create My Storybook!"}
            </button>
          </div>
        </div>
      )}

      {step === "generating" && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both", maxWidth: 400 }}>
          <div style={{ fontSize: 76, marginBottom: 22, animation: "float 2s ease-in-out infinite" }}>🪄</div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Creating your magical book...</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 8px" }}>{loadingMsg}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 28px" }}>Transforming photo, writing story & painting all scenes — about 1–2 minutes!</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "float 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      )}

      {step === "book" && story && (
        <div style={{ width: "100%", maxWidth: 880, animation: "fadeUp 0.5s ease both" }}>
          {falError && <div style={{ background: "rgba(255,100,100,0.09)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: 10, padding: "9px 14px", marginBottom: 14, color: "#ffaaaa", fontSize: 13, textAlign: "center" }}>⚠️ {falError}</div>}

          {/* Visible book */}
          {currentPage === -1 ? (
            <div id="pdf-cover" style={{ background: "linear-gradient(135deg, #2d1b4e, #4a2060)", borderRadius: 20, padding: "56px 40px", textAlign: "center", border: "2px solid rgba(255,215,0,0.28)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              {displayPhoto && <img crossOrigin="anonymous" src={displayPhoto} alt="hero" style={{ width: 148, height: 148, objectFit: "cover", borderRadius: 16, border: "5px solid #ffd700", marginBottom: 20 }} />}
              {cartoonUrl && <div style={{ marginBottom: 14 }}><span style={{ background: "rgba(255,215,0,0.18)", border: "1px solid rgba(255,215,0,0.35)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#ffd700", fontWeight: 600 }}>✨ Pixar-style cartoon</span></div>}
              <h1 style={{ color: "#ffd700", fontSize: 30, fontWeight: 800, margin: "0 0 10px" }}>{story.title}</h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontStyle: "italic", fontSize: 15, margin: "0 0 24px" }}>{story.dedication}</p>
              <button onClick={() => setCurrentPage(0)} style={{ padding: "11px 30px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Open Book →</button>
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
              <BookSpread spreadIndex={currentPage} />
            </div>
          )}

          {/* Navigation dots */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 22 }}>
            <button onClick={() => setCurrentPage(p => Math.max(-1, p - 1))} disabled={currentPage === -1} style={{ padding: "11px 22px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 14, cursor: currentPage === -1 ? "not-allowed" : "pointer", opacity: currentPage === -1 ? 0.3 : 1 }}>← Prev</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div onClick={() => setCurrentPage(-1)} title="Cover" style={{ width: currentPage === -1 ? 10 : 8, height: currentPage === -1 ? 10 : 8, borderRadius: "50%", background: currentPage === -1 ? "#ffd700" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s" }} />
              {Array.from({ length: Math.ceil(story.pages.length / 2) }, (_, i) => (
                <div key={i} onClick={() => setCurrentPage(i)} title={`Pages ${i * 2 + 1}–${Math.min(i * 2 + 2, story.pages.length)}`} style={{ width: currentPage === i ? 10 : 8, height: currentPage === i ? 10 : 8, borderRadius: "50%", background: currentPage === i ? "#ffd700" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(story.pages.length / 2) - 1, p + 1))} disabled={currentPage >= Math.ceil(story.pages.length / 2) - 1} style={{ padding: "11px 22px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 14, fontWeight: 600, cursor: currentPage >= Math.ceil(story.pages.length / 2) - 1 ? "not-allowed" : "pointer", opacity: currentPage >= Math.ceil(story.pages.length / 2) - 1 ? 0.4 : 1 }}>Next →</button>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={downloadPDF} disabled={pdfLoading} style={{ padding: "11px 24px", borderRadius: 11, border: "none", background: pdfLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #43e97b, #38f9d7)", color: pdfLoading ? "rgba(255,255,255,0.5)" : "#1a2e1a", fontSize: 14, fontWeight: 700, cursor: pdfLoading ? "not-allowed" : "pointer" }}>
              {pdfLoading ? "⏳ Generating PDF..." : "📥 Download PDF"}
            </button>
            <button onClick={() => { setStep("upload"); setPhoto(null); setCartoonUrl(null); setStory(null); setPageImages(Array(6).fill(null)); setPhotoFalUrl(null); setScenesGenerating(false); setChildGender("boy"); }} style={{ padding: "11px 22px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer" }}>+ New Book</button>
          </div>
        </div>
      )}

      {/* Off-screen PDF capture targets — always rendered when book is ready */}
      {step === "book" && story && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, width: 880, pointerEvents: "none" }} aria-hidden="true">
          {/* Cover */}
          <div id="pdf-cover-capture" style={{ width: 880, height: 520, background: "linear-gradient(135deg, #2d1b4e, #4a2060)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40 }}>
            {displayPhoto && <img crossOrigin="anonymous" src={displayPhoto} alt="hero" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 20, border: "5px solid #ffd700" }} />}
            <div style={{ color: "#ffd700", fontSize: 32, fontWeight: 800, textAlign: "center" }}>{story.title}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontStyle: "italic", fontSize: 16, textAlign: "center" }}>{story.dedication}</div>
          </div>
          {/* Spreads */}
          {Array.from({ length: Math.ceil(story.pages.length / 2) }, (_, i) => (
            <div key={i} id={`pdf-spread-${i}`} style={{ width: 880, background: "white", display: "flex" }}>
              <BookSpread spreadIndex={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
