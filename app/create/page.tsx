"use client";
import { useState, useRef, useCallback, useEffect } from "react";

const THEMES = [
  { id: "adventure", emoji: "🌋", title: "The Big Adventure", subtitle: "Quest & Exploration", desc: "Your child discovers a hidden world and must be brave to save the day", popular: true },
  { id: "dragon",    emoji: "🐉", title: "Dragon Tamer",      subtitle: "Fantasy & Magic",      desc: "A magical creature needs help and only your child has what it takes" },
  { id: "space",     emoji: "🚀", title: "To The Stars",      subtitle: "Space & Science",       desc: "Your child blasts off into the cosmos on a mission to save the universe" },
  { id: "ocean",     emoji: "🌊", title: "Deep Blue",          subtitle: "Ocean & Nature",        desc: "An underwater mystery only your child can solve" },
  { id: "jungle",    emoji: "🦁", title: "Jungle Crown",       subtitle: "Animals & Wildlife",    desc: "Your child becomes ruler of the animal kingdom for a day" },
  { id: "superpower",emoji: "🏆", title: "My Superpower",      subtitle: "Real Life Heroes",      desc: "Your child discovers their unique gift and uses it to help their community" },
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

const encodeShare = (data: object) => btoa(unescape(encodeURIComponent(JSON.stringify(data))));
const decodeShare = (s: string) => JSON.parse(decodeURIComponent(escape(atob(s))));
const rawFalUrl = (proxyUrl: string) => {
  try { return decodeURIComponent(proxyUrl.replace("/api/proxy?url=", "")); }
  catch { return proxyUrl; }
};

export default function StorybookCreator() {
  // ── Onboarding state ─────────────────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [stepDir, setStepDir]               = useState<"fwd" | "back">("fwd");
  const [mainStep, setMainStep]             = useState<"onboarding" | "generating" | "book">("onboarding");

  // ── Photo ────────────────────────────────────────────────────────────────────
  const [photo, setPhoto]           = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Avatar (generated in background during step 2) ───────────────────────────
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [cartoonUrl, setCartoonUrl]     = useState<string | null>(null);
  const [photoFalUrl, setPhotoFalUrl]   = useState<string | null>(null);
  const photoFalUrlRef  = useRef<string | null>(null);
  const avatarGenRef    = useRef<Promise<void> | null>(null);

  // ── Form ─────────────────────────────────────────────────────────────────────
  const [childName,   setChildName]   = useState("");
  const [childAge,    setChildAge]    = useState(5);
  const [childGender, setChildGender] = useState<"boy" | "girl" | "neutral">("boy");
  const [theme,       setTheme]       = useState("adventure");

  // ── Preview (step 4 — pages 1-2 free) ────────────────────────────────────────
  const [previewStory,  setPreviewStory]  = useState<any>(null);
  const [previewImages, setPreviewImages] = useState<(string | null)[]>([null, null]);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "done">("idle");
  const previewStarted = useRef(false);

  // ── Full book ─────────────────────────────────────────────────────────────────
  const [story,           setStory]           = useState<any>(null);
  const [pageImages,      setPageImages]      = useState<(string | null)[]>(Array(6).fill(null));
  const [scenesCompleted, setScenesCompleted] = useState(0);
  const [currentPage,     setCurrentPage]     = useState(-1);
  const [navDir,          setNavDir]          = useState<"fwd" | "back">("fwd");

  // ── UI ────────────────────────────────────────────────────────────────────────
  const [falError,         setFalError]         = useState<string | null>(null);
  const [loadingMsg,       setLoadingMsg]       = useState("");
  const [checkoutLoading,  setCheckoutLoading]  = useState<string | null>(null);
  const [pdfLoading,       setPdfLoading]       = useState(false);
  const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
  const [shareCopied,      setShareCopied]      = useState(false);
  const [isMobile,         setIsMobile]         = useState(false);
  const [isSharedView,     setIsSharedView]     = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 680);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Stripe return + share link ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState({}, "", "/create");

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
        setMainStep("book");
      } catch (e) { console.error("Invalid share link", e); }
      return;
    }

    const success   = params.get("success");
    const sessionId = params.get("session_id");
    const ref       = params.get("ref");
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
            setChildName(data.childName || "");
            setChildAge(data.childAge ?? 5);
            setChildGender(data.childGender || "boy");
            setTheme(data.theme || "adventure");
            if (data.cartoonFalUrl) {
              setPhotoFalUrl(data.cartoonFalUrl);
              photoFalUrlRef.current = data.cartoonFalUrl;
              setCartoonUrl(`/api/proxy?url=${encodeURIComponent(data.cartoonFalUrl)}`);
              setAvatarStatus("done");
            }
            setTimeout(() => generateFullBook(data), 50);
          }
        }).catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image compression ─────────────────────────────────────────────────────────
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
    setCartoonUrl(null); setAvatarStatus("idle"); setPhotoFalUrl(null);
    photoFalUrlRef.current = null; setPhotoReady(false);
    compressImage(file).then(b64 => {
      setPhotoBase64(b64); setPhotoReady(true);
    }).catch(() => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const b64 = (e.target?.result as string).split(",")[1];
        setPhotoBase64(b64); setPhotoReady(true);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  // ── Avatar generation ─────────────────────────────────────────────────────────
  const startAvatarGen = useCallback((base64: string) => {
    setAvatarStatus("loading");
    const promise = (async () => {
      try {
        const res = await fetch("/api/cartoonify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, gender: "neutral" }),
        }).then(r => r.json());
        if (res.url) {
          setCartoonUrl(`/api/proxy?url=${encodeURIComponent(res.url)}`);
          setPhotoFalUrl(res.url);
          photoFalUrlRef.current = res.url;
          setAvatarStatus("done");
        } else { setAvatarStatus("error"); }
      } catch { setAvatarStatus("error"); }
    })();
    avatarGenRef.current = promise;
  }, []);

  // ── Fallback story ────────────────────────────────────────────────────────────
  const getFallbackStory = (name: string) => ({
    title: `${name || "A Child"}'s Big Adventure`,
    dedication: `For ${name || "every child"} who dares to dream`,
    pages: [
      { pageNum: 1, text: `Once upon a time, ${name || "our hero"} woke up to find a magical map under their pillow.`, illustration: `A cozy bedroom at dawn, the child sitting up in bed holding a glowing treasure map that pulses with golden light` },
      { pageNum: 2, text: `${name || "Our hero"} packed a backpack and set off into the forest. "I'm ready!" they cheered.`, illustration: `A child in explorer gear with a colorful backpack standing at the edge of a glowing enchanted forest at golden hour` },
      { pageNum: 3, text: `The path led through an enchanted forest full of friendly butterflies and glowing flowers.`, illustration: `Inside a magical glowing forest, the child walking along a winding path surrounded by luminous mushrooms` },
      { pageNum: 4, text: `Deep in the forest they found a tiny dragon who had lost his fire.`, illustration: `A clearing in the enchanted forest, the child kneeling beside a small blue dragon with droopy wings` },
      { pageNum: 5, text: `${name || "Our hero"} told a joke and WHOOOOSH bright flames burst out! "You fixed me!" the dragon cried.`, illustration: `The child and a small dragon, the dragon joyfully breathing a spectacular rainbow flame into the sky` },
      { pageNum: 6, text: `The dragon flew them home under the stars. "Best day ever," they whispered.`, illustration: `A child riding on the back of a friendly glowing dragon soaring through a spectacular star-filled night sky` },
    ],
  });

  // ── Preview generation (step 4) ───────────────────────────────────────────────
  const generatePreview = useCallback(async () => {
    setPreviewStatus("loading");
    const selectedTheme = THEMES.find(t => t.id === theme);
    try {
      const [storyRes] = await Promise.all([
        fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childName,
            childAge: String(childAge),
            gender: childGender,
            theme: `${selectedTheme?.title} - ${selectedTheme?.subtitle}: ${selectedTheme?.desc}`,
          }),
        }).then(r => r.json()),
        // Wait for avatar in parallel
        avatarGenRef.current ?? Promise.resolve(),
      ]);
      const storyData = storyRes?.pages ? storyRes : getFallbackStory(childName);
      setPreviewStory(storyData);

      const falUrl = photoFalUrlRef.current;
      if (falUrl && storyData.pages) {
        await Promise.allSettled(storyData.pages.slice(0, 2).map(async (page: any, idx: number) => {
          try {
            const res = await fetch("/api/generate-scene", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photoUrl: falUrl, illustration: page.illustration, childName, gender: childGender }),
            }).then(r => r.json());
            if (res.url) {
              setPreviewImages(prev => { const n = [...prev]; n[idx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; });
            }
          } catch {}
        }));
      }
    } catch { setPreviewStory(getFallbackStory(childName)); }
    setPreviewStatus("done");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, childName, childAge, childGender]);

  // Trigger preview when step 4 mounts
  useEffect(() => {
    if (onboardingStep === 4 && !previewStarted.current) {
      previewStarted.current = true;
      generatePreview();
    }
  }, [onboardingStep, generatePreview]);

  // ── Full book generation ──────────────────────────────────────────────────────
  const generateFullBook = async (savedData?: any) => {
    const _base64  = savedData?.photoBase64   ?? photoBase64;
    const _name    = savedData?.childName     ?? childName;
    const _age     = savedData?.childAge      ?? childAge;
    const _gender  = savedData?.childGender   ?? childGender;
    const _theme   = savedData?.theme         ?? theme;
    const _story   = savedData?.story         ?? previewStory;
    const _falUrl  = savedData?.cartoonFalUrl ?? photoFalUrlRef.current;

    setMainStep("generating"); setFalError(null);
    setPageImages(Array(6).fill(null)); setScenesCompleted(0); setIsSharedView(false);

    try {
      let storyData = _story;
      let falUrl    = _falUrl;

      if (!storyData) {
        const selectedTheme = THEMES.find(t => t.id === _theme);
        setLoadingMsg("Writing your story... 📖");
        const res = await fetch("/api/story", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childName: _name, childAge: String(_age), gender: _gender, theme: `${selectedTheme?.title} - ${selectedTheme?.subtitle}` }),
        }).then(r => r.json());
        storyData = res?.pages ? res : getFallbackStory(_name);
      }

      if (!falUrl && _base64) {
        setLoadingMsg("Creating your hero... 🎨");
        try {
          const res = await fetch("/api/cartoonify", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: _base64, gender: _gender }),
          }).then(r => r.json());
          if (res.url) {
            falUrl = res.url;
            setCartoonUrl(`/api/proxy?url=${encodeURIComponent(res.url)}`);
            setPhotoFalUrl(res.url); photoFalUrlRef.current = res.url;
          }
        } catch { setFalError("Cartoon transformation failed — using original photo."); }
      }

      setStory(storyData);

      if (falUrl && storyData?.pages) {
        setLoadingMsg("Painting all your scenes... 🎨 (~1 min)");
        await Promise.allSettled(storyData.pages.map(async (page: any, idx: number) => {
          try {
            const res = await fetch("/api/generate-scene", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photoUrl: falUrl, illustration: page.illustration, childName: _name, gender: _gender }),
            }).then(r => r.json());
            if (res.url) {
              setPageImages(prev => { const n = [...prev]; n[idx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; });
              setScenesCompleted(p => p + 1);
            }
          } catch { setScenesCompleted(p => p + 1); }
        }));
      }

      setCurrentPage(-1); setMainStep("book");
    } catch (err) {
      console.error(err);
      setStory(getFallbackStory(_name)); setCurrentPage(-1); setMainStep("book");
    }
  };

  // ── Purchase flow ─────────────────────────────────────────────────────────────
  const handlePurchase = async (plan: "digital" | "print") => {
    if (!PAYMENTS_ENABLED) { generateFullBook(); return; }
    setCheckoutLoading(plan);
    try {
      const ref = crypto.randomUUID();
      sessionStorage.setItem(ref, JSON.stringify({
        photoBase64, childName, childAge, childGender, theme,
        story: previewStory, cartoonFalUrl: photoFalUrlRef.current, plan,
      }));
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, plan }),
      }).then(r => r.json());
      if (res.url) window.location.href = res.url;
      else throw new Error(res.error || "Checkout failed");
    } catch (err: any) {
      alert("Payment setup failed: " + err.message);
      setCheckoutLoading(null);
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────────
  const goToStep = (newStep: number) => {
    setStepDir(newStep > onboardingStep ? "fwd" : "back");
    setOnboardingStep(newStep);
  };

  const navigate = (newPage: number) => {
    setNavDir(newPage > currentPage ? "fwd" : "back");
    setCurrentPage(newPage);
  };

  // ── Regenerate / Share / PDF ──────────────────────────────────────────────────
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
    try { await navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); } catch {}
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
    } catch (err) { console.error("PDF error:", err); alert("PDF generation failed. Please try again."); }
    setPdfLoading(false);
  };

  const resetAll = () => {
    setMainStep("onboarding"); setOnboardingStep(1); setStepDir("fwd");
    setPhoto(null); setPhotoBase64(null); setPhotoReady(false);
    setCartoonUrl(null); setAvatarStatus("idle"); setPhotoFalUrl(null);
    photoFalUrlRef.current = null; avatarGenRef.current = null;
    setStory(null); setPreviewStory(null); setPreviewImages([null, null]); setPreviewStatus("idle");
    previewStarted.current = false;
    setPageImages(Array(6).fill(null)); setScenesCompleted(0);
    setChildGender("boy"); setChildName(""); setChildAge(5); setTheme("adventure");
    setIsSharedView(false); setRegeneratingPage(null); setFalError(null);
  };

  const totalPages   = story?.pages?.length ?? 6;
  const displayPhoto = cartoonUrl || photo;

  // ── BookPage ──────────────────────────────────────────────────────────────────
  const BookPage = ({ page, isLeft, isLast }: { page: any; isLeft: boolean; isLast?: boolean }) => {
    const bg          = PAGE_BACKGROUNDS[(page.pageNum - 1) % PAGE_BACKGROUNDS.length];
    const sceneImage  = pageImages[page.pageNum - 1];
    const isRegen     = regeneratingPage === page.pageNum - 1;

    if (isLeft) return (
      <div style={{ flex: 1, padding: isMobile ? "16px 16px 8px" : "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#fffef7", borderBottom: isMobile ? "2px solid #e8dcc8" : "none" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div className="scene-wrap" style={{ width: "100%", aspectRatio: "4/3", borderRadius: 14, overflow: "hidden", background: sceneImage ? "#1a1a2e" : bg, border: "3px solid rgba(255,255,255,0.5)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            {isRegen ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, border: "3px solid rgba(255,215,0,0.3)", borderTop: "3px solid #ffd700", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Repainting scene...</span>
              </div>
            ) : sceneImage ? (
              <img crossOrigin="anonymous" src={sceneImage} alt={`Page ${page.pageNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : displayPhoto ? (
              <img crossOrigin="anonymous" src={displayPhoto} alt="hero" style={{ height: "85%", width: "auto", maxWidth: "70%", objectFit: "contain", borderRadius: 12, filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))" }} />
            ) : null}
            {!isSharedView && photoFalUrl && !isRegen && (
              <button className="regen-btn" onClick={() => regenerateScene(page.pageNum - 1)} title="Regenerate this scene" style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "4px 8px", color: "white", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>🔄 Redo</button>
            )}
            {sceneImage && !isRegen
              ? <div style={{ position: "absolute", top: 8, right: 8, borderRadius: 8, background: "rgba(255,215,0,0.95)", padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ AI Scene</div>
              : cartoonUrl && !isRegen ? <div style={{ position: "absolute", top: 8, right: 8, borderRadius: 8, background: "rgba(255,215,0,0.95)", padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ Pixar Style</div>
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

  const BookSpread = ({ spreadIndex }: { spreadIndex: number }) => {
    const page   = story.pages[spreadIndex];
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

  // ── Mascot speech bubble ──────────────────────────────────────────────────────
  const Mascot = ({ message }: { message: string }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 22 }}>
      <div style={{ fontSize: 38, flexShrink: 0, animation: "float 3s ease-in-out infinite" }}>🧙</div>
      <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "18px 18px 18px 4px", padding: "11px 15px", maxWidth: 340 }}>
        <p style={{ color: "white", fontSize: 14, margin: 0, lineHeight: 1.65 }}>{message}</p>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 45%, #1a3a2e 100%)", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: isMobile ? "20px 12px 50px" : "36px 16px 70px" }}>
      <style>{`
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes slideInFwd  { from{opacity:0;transform:translateX(44px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes slideInBack { from{opacity:0;transform:translateX(-44px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulseDot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes fwdBar    { from{width:5%} to{width:95%} }
        input::placeholder{color:rgba(255,255,255,0.25);}
        input:focus{border-color:rgba(255,215,0,0.5)!important;outline:none;}
        input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:rgba(255,255,255,0.15);outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#ffd700;cursor:pointer;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);}
        .scene-wrap .regen-btn{opacity:0;transition:opacity 0.2s;}
        .scene-wrap:hover .regen-btn{opacity:1;}
        .theme-card{transition:transform 0.15s ease,box-shadow 0.15s ease;}
        .theme-card:hover{transform:translateY(-4px);box-shadow:0 8px 28px rgba(0,0,0,0.3)!important;}
        .gender-btn{transition:all 0.15s ease;}
        .gender-btn:hover{transform:scale(1.03);}
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: isMobile ? 18 : 24, animation: "fadeUp 0.5s ease both" }}>
        <div style={{ fontSize: isMobile ? 30 : 38, marginBottom: 4, animation: "float 3s ease-in-out infinite" }}>📚</div>
        <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, background: "linear-gradient(90deg, #ffd700, #ff9a9e, #a18cd1, #ffd700)", backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s ease infinite" }}>StoryBook Magic</h1>
      </div>

      {/* ════════════════ ONBOARDING ════════════════ */}
      {mainStep === "onboarding" && (
        <>
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{ height: 6, borderRadius: 3, background: s <= onboardingStep ? "#ffd700" : "rgba(255,255,255,0.15)", width: s === onboardingStep ? 30 : 16, transition: "all 0.35s ease" }} />
            ))}
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginLeft: 4 }}>Step {onboardingStep} of 4</span>
          </div>

          <div key={`step-${onboardingStep}`} style={{ width: "100%", maxWidth: onboardingStep === 3 ? 740 : 540, animation: `${stepDir === "fwd" ? "slideInFwd" : "slideInBack"} 0.3s ease both` }}>

            {/* ── STEP 1: Upload ── */}
            {onboardingStep === 1 && (
              <div>
                <Mascot message="Let's make some magic! ✨ Upload a clear photo of your child to get started." />

                <div
                  onClick={() => fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  style={{ background: dragOver ? "rgba(255,215,0,0.06)" : "rgba(255,255,255,0.04)", border: `2px dashed ${dragOver ? "#ffd700" : photo && photoReady ? "#4caf50" : "rgba(255,255,255,0.18)"}`, borderRadius: 24, padding: isMobile ? "44px 24px" : "60px 44px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                >
                  {photo && photoReady ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <img src={photo} alt="preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "50%", border: "4px solid #4caf50" }} />
                        <div style={{ position: "absolute", bottom: 0, right: 0, width: 36, height: 36, background: "#4caf50", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, border: "2.5px solid #1a0a2e", boxShadow: "0 2px 10px rgba(0,0,0,0.35)" }}>✓</div>
                      </div>
                      <p style={{ color: "#4caf50", fontWeight: 700, fontSize: 18, margin: "0 0 2px" }}>Perfect photo!</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>Tap to change</p>
                    </div>
                  ) : photo ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 44, height: 44, border: "3px solid rgba(255,215,0,0.3)", borderTop: "3px solid #ffd700", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>Processing...</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 68, marginBottom: 14 }}>📸</div>
                      <p style={{ color: "white", fontSize: 19, fontWeight: 700, margin: "0 0 6px" }}>Upload your child's photo</p>
                      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0 }}>Tap here or drag & drop</p>
                    </>
                  )}
                </div>

                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

                {/* Photo tips */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
                  {[{ icon: "😊", text: "Face clearly visible" }, { icon: "☀️", text: "Good lighting" }, { icon: "🚫", text: "No sunglasses" }].map(tip => (
                    <div key={tip.icon} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "7px 13px" }}>
                      <span style={{ fontSize: 16 }}>{tip.icon}</span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{tip.text}</span>
                    </div>
                  ))}
                </div>

                {photoReady && (
                  <button
                    onClick={() => { if (photoBase64) startAvatarGen(photoBase64); goToStep(2); }}
                    style={{ width: "100%", marginTop: 20, padding: "17px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 17, fontWeight: 700, cursor: "pointer", animation: "fadeUp 0.35s ease both" }}
                  >
                    Continue — Name your hero →
                  </button>
                )}
              </div>
            )}

            {/* ── STEP 2: Customize ── */}
            {onboardingStep === 2 && (
              <div>
                <Mascot message="Amazing! Every hero needs a name. What should we call them? 🌟" />

                {/* Avatar loading card */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,215,0,0.15)", borderRadius: 18, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={photo!} alt="original" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "50%", border: "2px solid rgba(255,215,0,0.3)" }} />
                    {avatarStatus === "loading" && (
                      <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2.5px solid transparent", borderTop: "2.5px solid #ffd700", animation: "spin 1s linear infinite" }} />
                    )}
                    {avatarStatus === "done" && (
                      <div style={{ position: "absolute", bottom: -2, right: -2, width: 20, height: 20, background: "#4caf50", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: "1.5px solid #1a0a2e" }}>✓</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "white", fontWeight: 600, fontSize: 13, margin: "0 0 7px" }}>
                      {avatarStatus === "done" ? "✨ Pixar transformation complete!" : avatarStatus === "error" ? "⚠️ Using original photo" : "🎨 Creating your hero..."}
                    </p>
                    <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #ffd700, #ff9a9e)", width: avatarStatus === "done" || avatarStatus === "error" ? "100%" : "0%", animation: avatarStatus === "loading" ? "fwdBar 30s linear forwards" : "none", transition: "width 0.5s" }} />
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "4px 0 0" }}>
                      {avatarStatus === "done" ? "Hero is ready to star in your story" : avatarStatus === "error" ? "We'll use your photo directly" : "Transforming into Pixar style — 30 secs"}
                    </p>
                  </div>
                  {avatarStatus === "done" && cartoonUrl && (
                    <img src={cartoonUrl} alt="hero" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "50%", border: "2px solid #ffd700", flexShrink: 0 }} />
                  )}
                </div>

                {/* Form */}
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: isMobile ? 18 : 26, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 22 }}>

                  {/* Name */}
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Child's first name</label>
                    <input
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="e.g. Emma, Liam, Zara..."
                      autoFocus
                      style={{ width: "100%", padding: "14px 16px", borderRadius: 13, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 20, fontWeight: 600, boxSizing: "border-box" }}
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Boy or Girl?</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {[{ id: "boy", emoji: "👦", label: "Boy" }, { id: "girl", emoji: "👧", label: "Girl" }].map(g => (
                        <div
                          key={g.id}
                          className="gender-btn"
                          onClick={() => setChildGender(g.id as "boy" | "girl" | "neutral")}
                          style={{ flex: 1, padding: "18px 12px", borderRadius: 16, cursor: "pointer", textAlign: "center", border: `2px solid ${childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.1)"}`, background: childGender === g.id ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)", boxShadow: childGender === g.id ? "0 0 16px rgba(255,215,0,0.15)" : "none" }}
                        >
                          <div style={{ fontSize: 36, marginBottom: 6 }}>{g.emoji}</div>
                          <div style={{ color: childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 15 }}>{g.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Age slider */}
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>
                      Age — <span style={{ color: "#ffd700", fontSize: 17, fontWeight: 700 }}>{childAge} years old</span>
                    </label>
                    <input type="range" min={1} max={12} step={1} value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} style={{ width: "100%" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>1 yr</span>
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>12 yrs</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button onClick={() => goToStep(1)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button
                    onClick={() => goToStep(3)}
                    disabled={!childName.trim()}
                    style={{ flex: 1, padding: "15px", borderRadius: 14, border: "none", background: childName.trim() ? "linear-gradient(135deg, #ffd700, #ff9a9e)" : "rgba(255,255,255,0.08)", color: childName.trim() ? "#1a0a2e" : "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 700, cursor: childName.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
                  >
                    {childName.trim() ? `Pick ${childName}'s adventure →` : "Enter a name to continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Themes ── */}
            {onboardingStep === 3 && (
              <div>
                <Mascot message={`Great choice! Now pick the perfect adventure for ${childName || "your little hero"}...`} />

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
                  {THEMES.map((t) => (
                    <div
                      key={t.id}
                      className="theme-card"
                      onClick={() => setTheme(t.id)}
                      style={{ position: "relative", padding: "22px 18px 18px", borderRadius: 20, cursor: "pointer", border: `2px solid ${theme === t.id ? "#ffd700" : "rgba(255,255,255,0.1)"}`, background: theme === t.id ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.04)", boxShadow: theme === t.id ? "0 0 24px rgba(255,215,0,0.18)" : "0 2px 8px rgba(0,0,0,0.2)" }}
                    >
                      {t.popular && (
                        <div style={{ position: "absolute", top: -10, right: 12, background: "linear-gradient(135deg, #ff6b6b, #ee5a24)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em", boxShadow: "0 2px 8px rgba(238,90,36,0.4)" }}>⭐ MOST POPULAR</div>
                      )}
                      <div style={{ fontSize: 44, marginBottom: 11 }}>{t.emoji}</div>
                      <div style={{ color: theme === t.id ? "#ffd700" : "white", fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{t.title}</div>
                      <div style={{ color: theme === t.id ? "rgba(255,215,0,0.65)" : "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 9 }}>{t.subtitle}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                  <button onClick={() => goToStep(2)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => goToStep(4)} style={{ flex: 1, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                    Preview your story →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Free Preview ── */}
            {onboardingStep === 4 && (
              <div>
                <Mascot message={`Here's a sneak peek of ${childName || "your child"}'s magical story! 🎉`} />

                {/* Loading state */}
                {previewStatus === "loading" && (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
                    <div style={{ fontSize: 52, marginBottom: 14, animation: "float 2s ease-in-out infinite" }}>🪄</div>
                    <p style={{ color: "white", fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>Writing your story...</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 18px" }}>Creating pages 1 & 2 for your free preview</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "pulseDot 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                )}

                {/* Pages 1-2 preview */}
                {previewStory && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                    {previewStory.pages.slice(0, 2).map((page: any, idx: number) => {
                      const bg    = PAGE_BACKGROUNDS[idx % PAGE_BACKGROUNDS.length];
                      const img   = previewImages[idx];
                      const photo_ = cartoonUrl || photo;
                      return (
                        <div key={idx} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", display: "flex", flexDirection: isMobile ? "column" : "row" }}>
                          {/* Image side */}
                          <div style={{ flex: 1, aspectRatio: isMobile ? "4/2.5" : undefined, minHeight: isMobile ? undefined : 180, background: img ? "#1a1a2e" : bg, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {img ? (
                              <img src={img} alt={`Page ${page.pageNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : photo_ ? (
                              <img src={photo_} alt="hero" style={{ height: "80%", width: "auto", maxWidth: "60%", objectFit: "contain", borderRadius: 10, filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.2))" }} />
                            ) : (
                              <div style={{ width: 32, height: 32, border: "3px solid rgba(255,215,0,0.3)", borderTop: "3px solid #ffd700", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                            )}
                            <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "3px 8px", color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700 }}>Page {page.pageNum}</div>
                            {img && <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,215,0,0.95)", borderRadius: 8, padding: "3px 8px", color: "#1a0a2e", fontSize: 10, fontWeight: 700 }}>✨ AI Scene</div>}
                          </div>
                          {/* Text side */}
                          <div style={{ flex: 1, padding: "18px 20px", background: "#fff8f0", display: "flex", alignItems: "center" }}>
                            <p style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: "#3d2b1f", margin: 0 }}>{page.text}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Locked pages 3-6 */}
                    <div style={{ position: "relative" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, filter: "blur(4px)", pointerEvents: "none", userSelect: "none" }}>
                        {[3, 4, 5, 6].map(n => (
                          <div key={n} style={{ background: "white", borderRadius: 14, overflow: "hidden", height: 80, display: "flex" }}>
                            <div style={{ flex: 1, background: PAGE_BACKGROUNDS[n % PAGE_BACKGROUNDS.length] }} />
                            <div style={{ flex: 1, background: "#fff8f0", padding: "12px 16px" }}>
                              <div style={{ height: 10, background: "#e0d4c8", borderRadius: 5, marginBottom: 7, width: "80%" }} />
                              <div style={{ height: 10, background: "#e0d4c8", borderRadius: 5, width: "60%" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(26,10,46,0.7)", borderRadius: 14, backdropFilter: "blur(2px)" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                        <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: "0 0 4px", textAlign: "center" }}>Pages 3–6 are waiting!</p>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>Unlock your full story below</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 22, padding: isMobile ? 18 : 24 }}>
                  <p style={{ color: "rgba(255,215,0,0.9)", fontSize: 13, fontWeight: 700, textAlign: "center", margin: "0 0 6px", letterSpacing: "0.04em" }}>⚡ Ready in under 2 minutes</p>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, textAlign: "center", margin: "0 0 18px" }}>6 personalised Pixar-style pages starring your child</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      onClick={() => handlePurchase("digital")}
                      disabled={!!checkoutLoading}
                      style={{ width: "100%", padding: "17px", borderRadius: 16, border: "none", background: checkoutLoading === "digital" ? "rgba(255,215,0,0.5)" : "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 17, fontWeight: 800, cursor: checkoutLoading ? "not-allowed" : "pointer", position: "relative" }}
                    >
                      {checkoutLoading === "digital" ? "Redirecting..." : PAYMENTS_ENABLED ? "Get Digital Book — $24.99 →" : "✨ Create My Storybook!"}
                    </button>

                    {PAYMENTS_ENABLED && (
                      <button
                        onClick={() => handlePurchase("print")}
                        disabled={!!checkoutLoading}
                        style={{ width: "100%", padding: "15px", borderRadius: 16, border: "2px solid rgba(255,215,0,0.35)", background: checkoutLoading === "print" ? "rgba(255,215,0,0.1)" : "rgba(255,215,0,0.07)", color: "#ffd700", fontSize: 16, fontWeight: 700, cursor: checkoutLoading ? "not-allowed" : "pointer" }}
                      >
                        {checkoutLoading === "print" ? "Redirecting..." : "🖨️ Print + Digital — $44.99"}
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 10 : 20, marginTop: 14, flexWrap: "wrap" }}>
                    {["🔒 Secure checkout", "📥 Instant download", "🔄 30-day guarantee"].map(t => (
                      <span key={t} style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{t}</span>
                    ))}
                  </div>
                </div>

                <button onClick={() => goToStep(3)} style={{ display: "block", margin: "14px auto 0", padding: "8px 16px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer" }}>← Change adventure</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════ GENERATING ════════════════ */}
      {mainStep === "generating" && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both", maxWidth: 400, width: "100%", padding: "0 16px" }}>
          <div style={{ fontSize: 72, marginBottom: 20, animation: "float 2s ease-in-out infinite" }}>🪄</div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Creating your magical book...</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 8px" }}>{loadingMsg}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 24px" }}>Painting all 6 scenes — about 1–2 minutes</p>
          {scenesCompleted > 0 && (
            <div style={{ maxWidth: 260, margin: "0 auto 24px" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #ffd700, #ff9a9e)", width: `${(scenesCompleted / totalPages) * 100}%`, transition: "width 0.4s ease" }} />
              </div>
              <p style={{ color: "rgba(255,215,0,0.7)", fontSize: 12, marginTop: 7 }}>{scenesCompleted} of {totalPages} scenes painted</p>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "pulseDot 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      )}

      {/* ════════════════ BOOK ════════════════ */}
      {mainStep === "book" && story && (
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 880, animation: "fadeUp 0.5s ease both" }}>
          {falError    && <div style={{ background: "rgba(255,100,100,0.09)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: 10, padding: "9px 14px", marginBottom: 12, color: "#ffaaaa", fontSize: 13, textAlign: "center" }}>⚠️ {falError}</div>}
          {isSharedView && <div style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, color: "rgba(255,215,0,0.8)", fontSize: 13, textAlign: "center" }}>📖 Viewing a shared storybook</div>}

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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 10 : 16, marginTop: 18 }}>
            <button onClick={() => navigate(Math.max(-1, currentPage - 1))} disabled={currentPage === -1}
              style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 14, cursor: currentPage === -1 ? "not-allowed" : "pointer", opacity: currentPage === -1 ? 0.3 : 1 }}>← Prev</button>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div onClick={() => navigate(-1)} style={{ width: currentPage === -1 ? 10 : 7, height: currentPage === -1 ? 10 : 7, borderRadius: "50%", background: currentPage === -1 ? "#ffd700" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s" }} />
              {story.pages.map((_: any, i: number) => (
                <div key={i} onClick={() => navigate(i)} style={{ width: currentPage === i ? 10 : 7, height: currentPage === i ? 10 : 7, borderRadius: "50%", background: currentPage === i ? "#ffd700" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
            <button onClick={() => navigate(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage >= totalPages - 1}
              style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 14, fontWeight: 600, cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer", opacity: currentPage >= totalPages - 1 ? 0.4 : 1 }}>Next →</button>
          </div>

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
      {mainStep === "book" && story && (
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
