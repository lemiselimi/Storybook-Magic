"use client";
import { useState, useRef, useCallback, useEffect } from "react";

const THEMES = [
  { id: "adventure",  emoji: "🌋", title: "The Big Adventure", subtitle: "Quest & Exploration",  desc: "Your child discovers a hidden world and must be brave to save the day", popular: true },
  { id: "dragon",     emoji: "🐉", title: "Dragon Tamer",      subtitle: "Fantasy & Magic",       desc: "A magical creature needs help and only your child has what it takes" },
  { id: "space",      emoji: "🚀", title: "To The Stars",      subtitle: "Space & Science",        desc: "Your child blasts off into the cosmos on a mission to save the universe" },
  { id: "ocean",      emoji: "🌊", title: "Deep Blue",          subtitle: "Ocean & Nature",         desc: "An underwater mystery only your child can solve" },
  { id: "jungle",     emoji: "🦁", title: "Jungle Crown",       subtitle: "Animals & Wildlife",     desc: "Your child becomes ruler of the animal kingdom for a day" },
  { id: "superpower", emoji: "🏆", title: "My Superpower",      subtitle: "Real Life Heroes",       desc: "Your child discovers their unique gift and uses it to help their community" },
];

const CHAPTER_NAMES = ["One", "Two", "Three", "Four", "Five", "Six"];

const THEME_CLOSING: Record<string, (name: string) => string> = {
  adventure:  (n) => `Remember, ${n}: every great adventure begins with one brave step. The world is full of magic — and you have everything it takes to find it.`,
  dragon:     (n) => `${n}, you showed the world that kindness is the greatest power of all. Even the most fearsome things become friends when met with a gentle heart.`,
  space:      (n) => `Reach for the stars, ${n} — because you already proved that one small, brave explorer is all it takes to light up the universe.`,
  ocean:      (n) => `The ocean is deep and full of mystery — but so is your courage, ${n}. Never stop diving deeper into the wonder of the world.`,
  jungle:     (n) => `You are the ruler of your own kingdom, ${n}. Lead with kindness, speak with courage, and the world will always follow.`,
  superpower: (n) => `Your superpower is real, ${n}. It lives inside you every single day. The world is a brighter, better place because you are in it.`,
};

const HAIR_COLORS = [
  { id: "blonde",      label: "Blonde",      hex: "#E8C76B" },
  { id: "brown",       label: "Brown",       hex: "#8B5E3C" },
  { id: "dark-brown",  label: "Dark Brown",  hex: "#3B1F0E" },
  { id: "black",       label: "Black",       hex: "#1A1A1A" },
  { id: "red",         label: "Red",         hex: "#C0392B" },
  { id: "auburn",      label: "Auburn",      hex: "#922B21" },
  { id: "gray",        label: "White/Gray",  hex: "#C8C8C8" },
];

const EYE_COLORS = [
  { id: "brown",       label: "Brown",       hex: "#7B4A3A" },
  { id: "dark-brown",  label: "Dark Brown",  hex: "#3E2207" },
  { id: "blue",        label: "Blue",        hex: "#4A90D9" },
  { id: "green",       label: "Green",       hex: "#3A7D44" },
  { id: "hazel",       label: "Hazel",       hex: "#8E7B5D" },
  { id: "gray",        label: "Gray",        hex: "#8A9BA8" },
];

const PAGE_BACKGROUNDS = [
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

const TOTAL_STEPS     = 5;
const PAYMENTS_ENABLED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const DEMO_STORY = {
  title: "Aria Saves the Universe",
  dedication: "For Aria, the bravest explorer in the cosmos",
  pages: [
    { pageNum: 1, text: "Once upon a time, Aria gazed up at the night sky and noticed something strange — the stars were going out, one by one.", illustration: "A young girl standing in her backyard at night, looking up at a dimming starry sky with wonder and determination" },
    { pageNum: 2, text: "'Mission Control needs our best astronaut!' Aria buckled her helmet, pressed the launch button, and WHOOOOSH — she blasted off!", illustration: "A brave young girl in a spacesuit launching into space aboard a gleaming silver rocket, leaving a trail of golden light" },
    { pageNum: 3, text: "In the heart of Galaxy 7, Aria discovered tiny star creatures whose home had gone cold and dark.", illustration: "A girl floating in deep space surrounded by small glowing star creatures looking sad, a dark galaxy behind them" },
    { pageNum: 4, text: "Aria had an idea! She shared her warmth with each little star — and one by one, they began to glow again.", illustration: "A girl in a spacesuit reaching out to touch star creatures that light up and sparkle with joy one by one" },
    { pageNum: 5, text: "The creatures cheered! Together they reignited every star in the galaxy, filling the sky with dazzling, magical light.", illustration: "A girl and star creatures celebrating as the entire galaxy lights up in brilliant colours around them" },
    { pageNum: 6, text: "Aria floated home beneath a million shining stars. 'Best adventure ever,' she whispered, smiling all the way.", illustration: "A girl in a spacesuit floating peacefully back toward Earth through a spectacular starry galaxy full of warm golden light" },
  ],
};
const DEMO_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800",
];
const DEMO_COVER = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800";

const encodeShare = (data: object) => btoa(unescape(encodeURIComponent(JSON.stringify(data))));
const decodeShare = (s: string)    => JSON.parse(decodeURIComponent(escape(atob(s))));
const rawFalUrl   = (proxyUrl: string) => {
  try { return decodeURIComponent(proxyUrl.replace("/api/proxy?url=", "")); }
  catch { return proxyUrl; }
};

// GA4 helper
const gtagEvent = (event: string, params?: object) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", event, params);
  }
};

export default function StorybookCreator() {
  // ── Flow state ───────────────────────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [stepDir,  setStepDir]  = useState<"fwd" | "back">("fwd");
  const [mainStep, setMainStep] = useState<"onboarding" | "generating" | "book">("onboarding");

  // ── Photos (multi-upload) ────────────────────────────────────────────────────
  const [photos,       setPhotos]       = useState<string[]>([]); // object URLs for display
  const [photosBase64, setPhotosBase64] = useState<string[]>([]); // compressed base64 for upload
  const [photosReady,  setPhotosReady]  = useState(false);        // true when >= 3 photos
  const [dragOver,     setDragOver]     = useState(false);
  const [photoLimitMsg, setPhotoLimitMsg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Appearance ───────────────────────────────────────────────────────────────
  const [hairColor, setHairColor] = useState("brown");
  const [eyeColor,  setEyeColor]  = useState("brown");

  // ── LoRA training ─────────────────────────────────────────────────────────────
  const [loraStatus, setLoraStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [loraUrl,    setLoraUrl]    = useState<string | null>(null);
  const loraUrlRef      = useRef<string | null>(null);
  const loraTrainingRef = useRef<Promise<void> | null>(null);

  // ── Form ─────────────────────────────────────────────────────────────────────
  const [childName,   setChildName]   = useState("");
  const [childAge,    setChildAge]    = useState(5);
  const [childGender, setChildGender] = useState<"boy" | "girl" | "neutral">("boy");
  const [theme,       setTheme]       = useState("adventure");

  // ── Preview (step 5) ─────────────────────────────────────────────────────────
  const [previewStory,   setPreviewStory]   = useState<any>(null);
  const [previewImages,  setPreviewImages]  = useState<(string | null)[]>(Array(6).fill(null));
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);
  const [previewStatus,  setPreviewStatus]  = useState<"idle" | "loading" | "done">("idle");
  const [previewMsg,     setPreviewMsg]     = useState("Writing your story...");
  const [previewDone,    setPreviewDone]    = useState(0); // scenes completed count (out of 7)
  const previewStarted = useRef(false);

  // ── Full book ─────────────────────────────────────────────────────────────────
  const [story,           setStory]           = useState<any>(null);
  const [coverImageUrl,   setCoverImageUrl]   = useState<string | null>(null);
  const [pageImages,      setPageImages]      = useState<(string | null)[]>(Array(6).fill(null));
  const [scenesCompleted, setScenesCompleted] = useState(0);
  const [currentPage,     setCurrentPage]     = useState(-2);
  const [navDir,          setNavDir]          = useState<"fwd" | "back">("fwd");

  // ── UI ────────────────────────────────────────────────────────────────────────
  const [falError,         setFalError]         = useState<string | null>(null);
  const [loadingMsg,       setLoadingMsg]       = useState("");
  const [checkoutLoading,  setCheckoutLoading]  = useState<string | null>(null);
  const [pdfLoading,       setPdfLoading]       = useState(false); // kept for compat
  const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
  const [shareCopied,      setShareCopied]      = useState(false);
  const [isMobile,         setIsMobile]         = useState(false);
  const [isSharedView,     setIsSharedView]     = useState(false);
  const [isDemo,           setIsDemo]           = useState(false);
  const [showNewBookConfirm, setShowNewBookConfirm] = useState(false);
  const [kontextResult,    setKontextResult]    = useState<string | null>(null);
  const [kontextLoading,   setKontextLoading]   = useState(false);
  const [kontextImageUrl,  setKontextImageUrl]  = useState("");

  // ── Email lead capture ────────────────────────────────────────────────────────
  const [leadEmail,    setLeadEmail]    = useState("");
  const [leadSent,     setLeadSent]     = useState(false);
  const [leadSending,  setLeadSending]  = useState(false);

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

    // Demo mode: ?demo=true — loads a mock book instantly, no API calls
    if (params.get("demo") === "true") {
      setChildName("Aria");
      setChildAge(5);
      setChildGender("girl");
      setTheme("space");
      setStory(DEMO_STORY);
      setPageImages(DEMO_IMAGES);
      setCoverImageUrl(DEMO_COVER);
      setCurrentPage(-2);
      setMainStep("book");
      setIsDemo(true);
      return;
    }

    const share = params.get("share");
    if (share) {
      try {
        const data = decodeShare(share);
        setStory(data.story);
        if (data.coverFalUrl) setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(data.coverFalUrl)}`);
        setPageImages((data.pageFalUrls || []).map((u: string | null) =>
          u ? `/api/proxy?url=${encodeURIComponent(u)}` : null
        ));
        setIsSharedView(true); setCurrentPage(-2); setMainStep("book");
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
          if (!result.ok) return;
          setChildName(data.childName || ""); setChildAge(data.childAge ?? 5);
          setChildGender(data.childGender || "boy"); setTheme(data.theme || "adventure");
          setHairColor(data.hairColor || "brown"); setEyeColor(data.eyeColor || "brown");
          if (data.loraUrl) {
            setLoraUrl(data.loraUrl); loraUrlRef.current = data.loraUrl; setLoraStatus("done");
          }
          if (data.coverFalUrl) setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(data.coverFalUrl)}`);
          setTimeout(() => generateFullBook(data), 50);
        }).catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image helpers ─────────────────────────────────────────────────────────────
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1024; let { width, height } = img;
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
      img.onerror = reject; img.src = objectUrl;
    });

  const addPhoto = useCallback((file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    // Hard cap at 3 — show message if already full
    setPhotosBase64(prev => {
      if (prev.length >= 3) {
        setPhotoLimitMsg(true);
        setTimeout(() => setPhotoLimitMsg(false), 3000);
        return prev;
      }
      return prev; // will be updated after compress
    });
    const objectUrl = URL.createObjectURL(file);
    setPhotos(prev => { if (prev.length >= 3) return prev; return [...prev, objectUrl]; });
    compressImage(file)
      .then(b64 => {
        setPhotosBase64(prev => {
          if (prev.length >= 3) return prev;
          const next = [...prev, b64];
          setPhotosReady(next.length >= 3);
          gtagEvent("photo_uploaded");
          return next;
        });
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const b64 = (e.target?.result as string).split(",")[1];
          setPhotosBase64(prev => {
            if (prev.length >= 3) return prev;
            const next = [...prev, b64];
            setPhotosReady(next.length >= 3);
            return next;
          });
        };
        reader.readAsDataURL(file);
      });
  }, []);

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotosBase64(prev => {
      const next = prev.filter((_, i) => i !== idx);
      setPhotosReady(next.length >= 3);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(f => addPhoto(f));
  };

  // ── LoRA training (called at step 3 → 4, after gender/age collected) ──────────
  // Submits the job immediately, then polls /api/check-lora every 5 s until done.
  // loraTrainingRef.current is a Promise that resolves when training completes,
  // so generatePreview can await it before generating scenes.
  const startLoraTraining = useCallback((base64s: string[]) => {
    setLoraStatus("loading");
    const promise = (async () => {
      try {
        // Step 1: upload ZIP + submit job (returns immediately with jobId)
        const submitRes = await fetch("/api/train-lora", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photosBase64: base64s }),
        }).then(r => r.json());

        if (submitRes.error || !submitRes.jobId) {
          console.error("LoRA submit failed:", submitRes.error);
          setLoraStatus("error"); return;
        }

        const jobId = submitRes.jobId;
        console.log("LoRA job submitted:", jobId);

        // Step 2: poll until COMPLETED (every 5 s, up to ~10 min)
        for (let i = 0; i < 120; i++) {
          await new Promise<void>(resolve => setTimeout(resolve, 5000));
          try {
            const pollRes = await fetch("/api/check-lora", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobId }),
            }).then(r => r.json());

            if (pollRes.status === "COMPLETED" && pollRes.loraUrl) {
              setLoraUrl(pollRes.loraUrl);
              loraUrlRef.current = pollRes.loraUrl;
              setLoraStatus("done");
              return;
            }
            if (pollRes.error || pollRes.status === "FAILED") {
              console.error("LoRA poll error:", pollRes.error ?? pollRes.status);
              setLoraStatus("error"); return;
            }
            // IN_QUEUE or IN_PROGRESS — keep polling
          } catch { /* network blip — retry next iteration */ }
        }
        // Timeout after 120 polls × 5 s = 10 min
        setLoraStatus("error");
      } catch { setLoraStatus("error"); }
    })();
    loraTrainingRef.current = promise;
  }, []);

  // ── Fallback story ────────────────────────────────────────────────────────────
  const getFallbackStory = (name: string) => ({
    title: `${name || "A Child"}'s Big Adventure`,
    dedication: `For ${name || "every child"} who dares to dream`,
    pages: [
      { pageNum: 1, text: `Once upon a time, ${name || "our hero"} woke up to find a magical map under their pillow.`, illustration: `A cozy bedroom at dawn, the child sitting up in bed holding a glowing treasure map` },
      { pageNum: 2, text: `${name || "Our hero"} packed a backpack and set off into the forest. "I'm ready!" they cheered.`, illustration: `A child in explorer gear at the edge of a glowing enchanted forest at golden hour` },
      { pageNum: 3, text: `The path led through an enchanted forest full of friendly butterflies and glowing flowers.`, illustration: `Inside a magical glowing forest, the child walking along a winding path with giant luminous mushrooms` },
      { pageNum: 4, text: `Deep in the forest they found a tiny dragon who had lost his fire.`, illustration: `A clearing in the enchanted forest, the child kneeling beside a small sad blue dragon` },
      { pageNum: 5, text: `${name || "Our hero"} told a joke and WHOOOOSH bright flames burst out! "You fixed me!" the dragon cried.`, illustration: `The child and a small dragon, the dragon joyfully breathing a spectacular rainbow flame into the sky` },
      { pageNum: 6, text: `The dragon flew them home under the stars. "Best day ever," they whispered.`, illustration: `A child riding on the back of a friendly glowing dragon soaring through a star-filled night sky` },
    ],
  });

  // ── Preview: generate cover + ALL 6 scenes (7 total), show loading until done ─
  const generatePreview = useCallback(async () => {
    setPreviewStatus("loading");
    setPreviewMsg("Writing your story... ✍️");
    setPreviewDone(0);
    setPreviewImages(Array(6).fill(null));
    setPreviewCoverUrl(null);

    const selectedTheme = THEMES.find(t => t.id === theme);
    const coverIllustration = `epic storybook cover, ${childName || "the child"} as the hero in a dramatic iconic pose, ${selectedTheme?.title} adventure theme, magical and vibrant atmosphere, bold storybook cover art composition`;

    try {
      const [storyRes] = await Promise.all([
        fetch("/api/story", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childName, childAge: String(childAge), gender: childGender, hairColor, eyeColor,
            theme: `${selectedTheme?.title} - ${selectedTheme?.subtitle}: ${selectedTheme?.desc}`,
          }),
        }).then(r => r.json()),
        loraTrainingRef.current ?? Promise.resolve(),
      ]);

      if (storyRes?.error === "limit_reached") {
        setPreviewMsg("Preview limit reached — please purchase to continue.");
        setPreviewStatus("done");
        setPreviewStory({ title: "", dedication: "", pages: [], _limitReached: true });
        return;
      }
      const storyData = storyRes?.pages ? storyRes : getFallbackStory(childName);
      setPreviewStory(storyData);
      setPreviewMsg("Starting illustrations... 🖌️");

      const falUrl = loraUrlRef.current;
      if (falUrl && storyData.pages) {
        let done = 0;
        const total = 7; // 1 cover + 6 pages

        // Generate cover + all 6 page scenes in parallel
        await Promise.allSettled([
          // Cover image (portrait orientation)
          (async () => {
            try {
              const res = await fetch("/api/generate-scene", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loraUrl: falUrl, illustration: coverIllustration, childName, gender: childGender, childAge, hairColor, eyeColor, isCover: true }),
              }).then(r => r.json());
              if (res.url) {
                setPreviewCoverUrl(`/api/proxy?url=${encodeURIComponent(res.url)}`);
                done++;
                setPreviewDone(done);
                setPreviewMsg(done < total ? `Illustrated ${done} of ${total}... ✨` : "All illustrations ready! 🎉");
              }
            } catch {}
          })(),
          // Page scenes
          ...storyData.pages.map(async (page: any, idx: number) => {
            try {
              const res = await fetch("/api/generate-scene", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loraUrl: falUrl, illustration: page.illustration, childName, gender: childGender, childAge, hairColor, eyeColor }),
              }).then(r => r.json());
              if (res.url) {
                setPreviewImages(prev => { const n = [...prev]; n[idx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; });
                done++;
                setPreviewDone(done);
                setPreviewMsg(done < total ? `Illustrated ${done} of ${total}... ✨` : "All illustrations ready! 🎉");
              }
            } catch {}
          }),
        ]);
      }
    } catch { setPreviewStory(getFallbackStory(childName)); }

    setPreviewStatus("done");
    gtagEvent("book_generated", { theme, childAge });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, childName, childAge, childGender, hairColor, eyeColor]);

  useEffect(() => {
    if (onboardingStep === 5 && !previewStarted.current) {
      previewStarted.current = true;
      generatePreview();
    }
  }, [onboardingStep, generatePreview]);

  // ── Full book generation (post-purchase) ─────────────────────────────────────
  const generateFullBook = async (savedData?: any) => {
    const _name          = savedData?.childName     ?? childName;
    const _age           = savedData?.childAge      ?? childAge;
    const _gender        = savedData?.childGender   ?? childGender;
    const _theme         = savedData?.theme         ?? theme;
    const _hair          = savedData?.hairColor     ?? hairColor;
    const _eye           = savedData?.eyeColor      ?? eyeColor;
    const _savedStory    = savedData?.story         ?? previewStory;
    const _savedFalUrls  = savedData?.previewFalUrls as (string | null)[] | undefined;
    const _savedCoverUrl = savedData?.coverFalUrl   as string | undefined;
    const _loraUrl       = savedData?.loraUrl ?? loraUrlRef.current;

    // Restore LoRA URL
    if (_loraUrl) { setLoraUrl(_loraUrl); loraUrlRef.current = _loraUrl; setLoraStatus("done"); }

    // Restore cover if it came back from Stripe session
    if (_savedCoverUrl) setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(_savedCoverUrl)}`);

    // Fast path: all scenes + cover already generated in preview
    if (_savedStory && _savedFalUrls && _savedFalUrls.filter(Boolean).length === 6) {
      setStory(_savedStory);
      setPageImages(_savedFalUrls.map(u => u ? `/api/proxy?url=${encodeURIComponent(u)}` : null));
      setCurrentPage(-2); setMainStep("book"); return;
    }

    // If preview images exist in state, reuse them (including cover)
    const existingImages = previewImages.filter(Boolean).length === 6 ? previewImages : null;
    if (_savedStory && existingImages) {
      setStory(_savedStory); setPageImages(existingImages);
      if (previewCoverUrl) setCoverImageUrl(previewCoverUrl);
      setCurrentPage(-2); setMainStep("book"); return;
    }

    // Full generation from scratch
    setMainStep("generating"); setFalError(null);
    setPageImages(Array(6).fill(null)); setCoverImageUrl(null); setScenesCompleted(0); setIsSharedView(false);

    try {
      let storyData = _savedStory;
      let falUrl    = _loraUrl;

      if (!storyData) {
        const sel = THEMES.find(t => t.id === _theme);
        setLoadingMsg("Writing your story... 📖");
        const res = await fetch("/api/story", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childName: _name, childAge: String(_age), gender: _gender, hairColor: _hair, eyeColor: _eye, theme: `${sel?.title} - ${sel?.subtitle}` }),
        }).then(r => r.json());
        storyData = res?.pages ? res : getFallbackStory(_name);
      }

      setStory(storyData);

      if (falUrl && storyData?.pages) {
        const sel = THEMES.find(t => t.id === _theme);
        const coverIllustration = `epic storybook cover, ${_name} as the hero in a dramatic iconic pose, ${sel?.title} adventure theme, magical and vibrant atmosphere, bold storybook cover art composition`;
        setLoadingMsg("Painting cover & all scenes... 🎨 (~1 min)");
        await Promise.allSettled([
          // Cover
          (async () => {
            try {
              const res = await fetch("/api/generate-scene", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loraUrl: falUrl, illustration: coverIllustration, childName: _name, gender: _gender, childAge: _age, hairColor: _hair, eyeColor: _eye, isCover: true }),
              }).then(r => r.json());
              if (res.url) { setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(res.url)}`); setScenesCompleted(p => p + 1); }
            } catch { setScenesCompleted(p => p + 1); }
          })(),
          // Pages
          ...storyData.pages.map(async (page: any, idx: number) => {
            try {
              const res = await fetch("/api/generate-scene", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loraUrl: falUrl, illustration: page.illustration, childName: _name, gender: _gender, childAge: _age, hairColor: _hair, eyeColor: _eye }),
              }).then(r => r.json());
              if (res.url) { setPageImages(prev => { const n = [...prev]; n[idx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; }); setScenesCompleted(p => p + 1); }
            } catch { setScenesCompleted(p => p + 1); }
          }),
        ]);
      }

      setCurrentPage(-2); setMainStep("book");
    } catch (err) {
      console.error(err);
      setStory(getFallbackStory(_name)); setCurrentPage(-2); setMainStep("book");
    }
  };

  // ── Purchase ──────────────────────────────────────────────────────────────────
  const handlePurchase = async (plan: "digital" | "print") => {
    gtagEvent("begin_checkout", { plan, value: plan === "print" ? 37.99 : 17.99, currency: "USD" });
    if (!PAYMENTS_ENABLED) { generateFullBook(); return; }
    setCheckoutLoading(plan);
    try {
      const ref = crypto.randomUUID();
      sessionStorage.setItem(ref, JSON.stringify({
        childName, childAge, childGender, theme, hairColor, eyeColor,
        story: previewStory,
        loraUrl: loraUrlRef.current,
        coverFalUrl: previewCoverUrl ? rawFalUrl(previewCoverUrl) : null,
        previewFalUrls: previewImages.map(u => u ? rawFalUrl(u) : null),
        plan,
      }));
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, plan }),
      }).then(r => r.json());
      if (res.url) window.location.href = res.url;
      else throw new Error(res.error || "Checkout failed");
    } catch (err: any) { alert("Payment setup failed: " + err.message); setCheckoutLoading(null); }
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

  // ── Regen / Share / PDF ───────────────────────────────────────────────────────
  const regenerateScene = async (pageIdx: number) => {
    if (!loraUrl || regeneratingPage !== null) return;
    setRegeneratingPage(pageIdx);
    try {
      const page = story.pages[pageIdx];
      const res = await fetch("/api/generate-scene", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loraUrl, illustration: page.illustration, childName, gender: childGender, childAge, hairColor, eyeColor }),
      }).then(r => r.json());
      if (res.url) setPageImages(prev => { const n = [...prev]; n[pageIdx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; });
    } catch (err) { console.error("Regenerate failed:", err); }
    setRegeneratingPage(null);
  };

  const submitLeadEmail = async () => {
    if (!leadEmail || leadSent) return;
    setLeadSending(true);
    try {
      const shareUrl = `${window.location.origin}/create?share=${encodeShare({ story: previewStory, coverFalUrl: previewCoverUrl ? rawFalUrl(previewCoverUrl) : null, pageFalUrls: previewImages.map(u => u ? rawFalUrl(u) : null) })}`;
      await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "preview_lead", email: leadEmail, shareUrl }) });
      setLeadSent(true);
      gtagEvent("lead_captured", { method: "preview_email" });
    } catch {}
    setLeadSending(false);
  };

  const copyShareLink = async () => {
    if (!story) return;
    const data = { story, coverFalUrl: coverImageUrl ? rawFalUrl(coverImageUrl) : null, pageFalUrls: pageImages.map(u => u ? rawFalUrl(u) : null) };
    const url = `${window.location.origin}/create?share=${encodeShare(data)}`;
    try { await navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); } catch {}
  };

  const printBook = () => {
    window.print();
  };

  const resetAll = () => {
    setMainStep("onboarding"); setOnboardingStep(1); setStepDir("fwd");
    setPhotos([]); setPhotosBase64([]); setPhotosReady(false);
    setLoraUrl(null); setLoraStatus("idle");
    loraUrlRef.current = null; loraTrainingRef.current = null;
    setHairColor("brown"); setEyeColor("brown");
    setStory(null); setPreviewStory(null); setPreviewImages(Array(6).fill(null));
    setPreviewCoverUrl(null); setCoverImageUrl(null);
    setPreviewStatus("idle"); setPreviewDone(0); previewStarted.current = false;
    setPageImages(Array(6).fill(null)); setScenesCompleted(0);
    setChildGender("boy"); setChildName(""); setChildAge(5); setTheme("adventure");
    setIsSharedView(false); setRegeneratingPage(null); setFalError(null); setIsDemo(false); setShowNewBookConfirm(false);
  };

  const totalPages   = story?.pages?.length ?? 6;
  const displayPhoto = photos[0] ?? null;

  // ── BookPage / BookSpread — premium printed book layout ──────────────────────
  const BookTextPage = ({ page }: { page: any }) => {
    const chapterNum = CHAPTER_NAMES[(page.pageNum - 1)] || String(page.pageNum);
    return (
      <div className="book-text-page" style={{ flex: 1, background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isMobile ? "24px 22px 20px" : "44px 42px 36px", position: "relative", overflow: "hidden" }}>
        {/* Subtle radial glow */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 30% 25%, rgba(107,63,160,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Chapter header */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ height: 1, flex: 1, background: "rgba(255,215,0,0.22)" }} />
            <span style={{ color: "rgba(255,215,0,0.65)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>Chapter {chapterNum}</span>
            <div style={{ height: 1, flex: 1, background: "rgba(255,215,0,0.22)" }} />
          </div>
          <p style={{ color: "rgba(255,215,0,0.38)", fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", margin: 0, textAlign: "center" }}>{story?.title}</p>
        </div>

        {/* Story text */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: isMobile ? "20px 0" : "28px 0" }}>
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isMobile ? 15 : 18, lineHeight: 2, color: "rgba(255,255,255,0.92)", margin: 0, letterSpacing: "0.01em" }}>
            {page.text}
          </p>
        </div>

        {/* Page number */}
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ height: 1, background: "rgba(255,215,0,0.15)", marginBottom: 12 }} />
          <span style={{ color: "rgba(255,215,0,0.45)", fontFamily: "Georgia, serif", fontSize: 11, letterSpacing: "0.12em" }}>— {page.pageNum} —</span>
        </div>
      </div>
    );
  };

  const BookIllustrationPage = ({ page }: { page: any }) => {
    const sceneImg = pageImages[page.pageNum - 1];
    const isRegen  = regeneratingPage === page.pageNum - 1;
    return (
      <div className="scene-wrap" style={{ flex: 1, position: "relative", background: "#0d0718", overflow: "hidden", minHeight: isMobile ? 260 : undefined }}>
        {isRegen ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(255,215,0,0.2)", borderTop: "3px solid #ffd700", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Repainting...</span>
          </div>
        ) : sceneImg ? (
          <img crossOrigin="anonymous" src={sceneImg} alt={`Page ${page.pageNum}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          /* Placeholder while AI illustration is generating */
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 60%, #0d071e 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 36, height: 36, border: "3px solid rgba(255,215,0,0.15)", borderTop: "3px solid rgba(255,215,0,0.5)", borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
          </div>
        )}
        {!isSharedView && loraUrl && !isRegen && (
          <button className="regen-btn" onClick={() => regenerateScene(page.pageNum - 1)} style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: "5px 10px", color: "rgba(255,255,255,0.75)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, backdropFilter: "blur(4px)" }}>🔄 Redo</button>
        )}
      </div>
    );
  };

  const BookSpread = ({ spreadIndex }: { spreadIndex: number }) => {
    const page = story.pages[spreadIndex];
    if (!page) return null;
    if (isMobile) return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <BookIllustrationPage page={page} />
        <BookTextPage page={page} />
      </div>
    );
    return (
      <div style={{ display: "flex", width: "100%", height: 500 }}>
        <BookTextPage page={page} />
        <div style={{ width: 10, flexShrink: 0, background: "linear-gradient(to right, #0a0518 0%, #1a0a2e 40%, #0d0818 100%)", boxShadow: "inset -4px 0 8px rgba(0,0,0,0.4), inset 4px 0 8px rgba(0,0,0,0.4)" }} />
        <BookIllustrationPage page={page} />
      </div>
    );
  };

  // ── Shared dark-page frame (dedication + closing) ─────────────────────────────
  const DarkFrame = ({ children }: { children: React.ReactNode }) => (
    <div style={{ borderRadius: isMobile ? 16 : 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.18)", animation: "fadeUp 0.4s ease both", background: "linear-gradient(160deg, #0d071e 0%, #2D1B69 50%, #0d071e 100%)", minHeight: isMobile ? 420 : 560, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: isMobile ? 32 : 60 }}>
      {/* Double gold border */}
      <div style={{ position: "absolute", inset: isMobile ? 16 : 24, border: "1.5px solid rgba(255,215,0,0.35)", borderRadius: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: isMobile ? 24 : 36, border: "0.5px solid rgba(255,215,0,0.15)", borderRadius: 6, pointerEvents: "none" }} />
      {/* Corner sparkles */}
      {(["6%,6%", "88%,6%", "6%,88%", "88%,88%"] as const).map((pos, i) => (
        <span key={i} style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], color: "rgba(255,215,0,0.5)", fontSize: isMobile ? 14 : 18, lineHeight: 1 }}>✦</span>
      ))}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 500 }}>{children}</div>
    </div>
  );

  // ── Mascot ────────────────────────────────────────────────────────────────────
  const Mascot = ({ msg }: { msg: string }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 22 }}>
      <div style={{ fontSize: 38, flexShrink: 0, animation: "float 3s ease-in-out infinite" }}>🧙</div>
      <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "18px 18px 18px 4px", padding: "11px 15px", maxWidth: 360 }}>
        <p style={{ color: "white", fontSize: 14, margin: 0, lineHeight: 1.65 }}>{msg}</p>
      </div>
    </div>
  );

  // ── Color Picker ──────────────────────────────────────────────────────────────
  const ColorPicker = ({ label, colors, selected, onSelect }: { label: string; colors: typeof HAIR_COLORS; selected: string; onSelect: (id: string) => void }) => (
    <div>
      <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>{label}</label>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {colors.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            title={c.label}
            style={{ position: "relative", width: 52, height: 52, borderRadius: "50%", background: c.hex, border: `3px solid ${selected === c.id ? "#ffd700" : "rgba(255,255,255,0.15)"}`, cursor: "pointer", boxShadow: selected === c.id ? "0 0 0 3px rgba(255,215,0,0.3), 0 4px 12px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.3)", transition: "all 0.15s ease", padding: 0, flexShrink: 0 }}
            aria-label={c.label}
          >
            {selected === c.id && (
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c.hex === "#1A1A1A" || c.hex === "#3B1F0E" || c.hex === "#922B21" || c.hex === "#3E2207" ? "white" : "rgba(0,0,0,0.7)", fontSize: 20, fontWeight: 700 }}>✓</span>
            )}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
        {colors.map(c => (
          <div key={c.id} style={{ width: 52, textAlign: "center", color: selected === c.id ? "#ffd700" : "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: selected === c.id ? 700 : 400, transition: "color 0.15s" }}>{c.label}</div>
        ))}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 45%, #1a3a2e 100%)", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: isMobile ? "20px 12px 50px" : "36px 16px 70px" }}>
      <style>{`
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
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

        /* ── Print styles ── */
        @media print {
          @page { size: landscape; margin: 0; padding: 0; }
          * { margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
          html, body { width: 100vw; height: 100vh; overflow: hidden; }
          body * { visibility: hidden !important; }
          #print-book-root,
          #print-book-root * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #print-book-root {
            display: block !important;
            position: absolute;
            top: 0; left: 0;
            width: 100vw;
          }
          .print-page {
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
            overflow: hidden;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: row;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-page-col {
            display: flex !important;
            flex-direction: column;
          }
          .print-page:last-child { page-break-after: avoid; break-after: avoid; }
          .book-text-page {
            padding-left: 48px !important;
            padding-right: 24px !important;
            padding-top: 80px !important;
          }
        }
        @media not print {
          #print-book-root { display: none !important; }
        }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: isMobile ? 18 : 24, animation: "fadeUp 0.5s ease both" }}>
        <div style={{ fontSize: isMobile ? 30 : 38, marginBottom: 4, animation: "float 3s ease-in-out infinite" }}>✨</div>
        <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, background: "linear-gradient(90deg, #ffd700, #ff9a9e, #a18cd1, #ffd700)", backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s ease infinite" }}>My Tiny Tales</h1>
      </div>

      {/* ══ ONBOARDING ══════════════════════════════════════════════════════════ */}
      {mainStep === "onboarding" && (
        <>
          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} style={{ height: 6, borderRadius: 3, background: i + 1 <= onboardingStep ? "#ffd700" : "rgba(255,255,255,0.15)", width: i + 1 === onboardingStep ? 28 : 14, transition: "all 0.35s ease" }} />
            ))}
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginLeft: 4 }}>Step {onboardingStep} of {TOTAL_STEPS}</span>
          </div>

          <div key={`step-${onboardingStep}`} style={{ width: "100%", maxWidth: onboardingStep === 4 ? 740 : 540, animation: `${stepDir === "fwd" ? "slideInFwd" : "slideInBack"} 0.3s ease both` }}>

            {/* ── STEP 1: Upload ── */}
            {onboardingStep === 1 && (
              <div>
                <Mascot msg="Upload 3 clear photos of your child for the best likeness. Face clearly visible, good lighting, different angles." />

                {/* Photo grid */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  style={{ background: dragOver ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.03)", border: `2px dashed ${dragOver ? "#ffd700" : photos.length === 3 ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.15)"}`, borderRadius: 22, padding: "20px", transition: "all 0.2s" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: photos.length < 3 ? 12 : 0 }}>
                    {photos.map((src, i) => (
                      <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 14, overflow: "hidden", border: "2px solid rgba(76,175,80,0.5)" }}>
                        <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "white", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                        {i === 0 && <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(76,175,80,0.9)", borderRadius: 6, padding: "2px 6px", fontSize: 9, fontWeight: 700, color: "white" }}>MAIN</div>}
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <div onClick={() => fileRef.current?.click()} style={{ aspectRatio: "1", borderRadius: 14, border: "2px dashed rgba(255,255,255,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6, background: "rgba(255,255,255,0.03)", transition: "all 0.15s" }}>
                        <span style={{ fontSize: 28, opacity: 0.5 }}>+</span>
                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center" }}>{photos.length === 0 ? "Add photo" : "Add more"}</span>
                      </div>
                    )}
                  </div>

                  {photos.length === 0 && (
                    <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
                      <div style={{ fontSize: 52, marginBottom: 10 }}>📸</div>
                      <p style={{ color: "white", fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>Upload exactly 3 photos</p>
                      <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: 0 }}>Tap + or drag & drop photos here</p>
                    </div>
                  )}

                  {/* "All done" state — shown when 3 photos uploaded */}
                  {photos.length === 3 && (
                    <div style={{ textAlign: "center", padding: "10px 0 4px", color: "#4caf50", fontWeight: 700, fontSize: 14 }}>
                      ✓ Perfect! 3 photos uploaded
                    </div>
                  )}
                </div>

                {/* Photo limit toast */}
                {photoLimitMsg && (
                  <div style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 10, padding: "9px 14px", marginTop: 10, color: "#ffd700", fontSize: 13, textAlign: "center", animation: "fadeUp 0.2s ease both" }}>
                    3 photos is all we need for the best likeness!
                  </div>
                )}

                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { Array.from(e.target.files ?? []).forEach(f => addPhoto(f)); e.target.value = ""; }} />

                {/* Progress indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                  {[1, 2, 3].map(n => (
                    <div key={n} style={{ flex: 1, height: 5, borderRadius: 3, background: n <= photos.length ? "#4caf50" : "rgba(255,255,255,0.12)", transition: "background 0.3s" }} />
                  ))}
                  <span style={{ color: photos.length === 3 ? "#4caf50" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {photos.length}/3 {photos.length === 3 ? "✓ Ready!" : `(need ${3 - photos.length} more)`}
                  </span>
                </div>

                {/* Privacy reassurance */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: 12, padding: "10px 14px", marginTop: 12 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>Photos are <strong style={{ color: "#4caf50" }}>private & secure</strong> — used only to personalise your book, then permanently deleted.</p>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {[{ icon: "😊", text: "Face clearly visible" }, { icon: "☀️", text: "Good lighting" }, { icon: "🔄", text: "Different angles" }].map(tip => (
                    <div key={tip.icon} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "7px 13px" }}>
                      <span style={{ fontSize: 16 }}>{tip.icon}</span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{tip.text}</span>
                    </div>
                  ))}
                </div>

                {photos.length === 3 ? (
                  <button onClick={() => goToStep(2)} style={{ width: "100%", marginTop: 20, padding: "17px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 17, fontWeight: 700, cursor: "pointer", animation: "fadeUp 0.35s ease both" }}>
                    Continue →
                  </button>
                ) : photos.length > 0 ? (
                  <div style={{ marginTop: 20, padding: "14px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                    Please upload 3 photos to continue
                  </div>
                ) : null}
              </div>
            )}

            {/* ── STEP 2: Appearance ── */}
            {onboardingStep === 2 && (
              <div>
                <Mascot msg="Let's make sure we get every detail right! 🎨 Pick your child's hair and eye colour." />
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: isMobile ? 18 : 28, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 28 }}>
                  <ColorPicker label="Hair colour" colors={HAIR_COLORS} selected={hairColor} onSelect={setHairColor} />
                  <ColorPicker label="Eye colour"  colors={EYE_COLORS}  selected={eyeColor}  onSelect={setEyeColor}  />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button onClick={() => goToStep(1)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button
                    onClick={() => goToStep(3)}
                    style={{ flex: 1, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
                  >
                    Looks perfect! →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Customize (name / gender / age) ── */}
            {onboardingStep === 3 && (
              <div>
                <Mascot msg="Amazing! Every hero needs a name. What should we call them? 🌟" />

                {/* Form */}
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: isMobile ? 18 : 26, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 22 }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Child's first name</label>
                    <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="e.g. Emma, Liam, Zara..." autoFocus style={{ width: "100%", padding: "14px 16px", borderRadius: 13, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 20, fontWeight: 600, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Boy or Girl?</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {[{ id: "boy", emoji: "👦", label: "Boy" }, { id: "girl", emoji: "👧", label: "Girl" }].map(g => (
                        <div key={g.id} onClick={() => setChildGender(g.id as "boy" | "girl" | "neutral")} style={{ flex: 1, padding: "18px 12px", borderRadius: 16, cursor: "pointer", textAlign: "center", border: `2px solid ${childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.1)"}`, background: childGender === g.id ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)", transition: "all 0.15s", boxShadow: childGender === g.id ? "0 0 16px rgba(255,215,0,0.15)" : "none" }}>
                          <div style={{ fontSize: 36, marginBottom: 6 }}>{g.emoji}</div>
                          <div style={{ color: childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 15 }}>{g.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                  <button onClick={() => goToStep(2)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => { if (photosBase64.length > 0 && loraStatus === "idle") startLoraTraining(photosBase64); goToStep(4); }} disabled={!childName.trim()} style={{ flex: 1, padding: "15px", borderRadius: 14, border: "none", background: childName.trim() ? "linear-gradient(135deg, #ffd700, #ff9a9e)" : "rgba(255,255,255,0.08)", color: childName.trim() ? "#1a0a2e" : "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 700, cursor: childName.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                    {childName.trim() ? `Pick ${childName}'s adventure →` : "Enter a name to continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Themes ── */}
            {onboardingStep === 4 && (
              <div>
                <Mascot msg={`Great! Now pick the perfect adventure for ${childName || "your little hero"}...`} />

                {/* LoRA training progress indicator */}
                {loraStatus !== "idle" && (
                  <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${loraStatus === "done" ? "rgba(76,175,80,0.35)" : loraStatus === "error" ? "rgba(255,80,80,0.3)" : "rgba(255,215,0,0.2)"}`, borderRadius: 18, padding: "18px 20px", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Photo thumbnails */}
                      <div style={{ display: "flex", flexShrink: 0 }}>
                        {photos.slice(0, 3).map((src, i) => (
                          <div key={i} style={{ position: "relative", width: 38, height: 38, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,215,0,0.3)", marginLeft: i > 0 ? -10 : 0 }}>
                            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "white", fontWeight: 600, fontSize: 13, margin: "0 0 6px" }}>
                          {loraStatus === "done" ? "✨ Learning complete — ready to illustrate!" : loraStatus === "error" ? "⚠️ Training issue — proceeding anyway" : "🧠 Learning your child's unique look..."}
                        </p>
                        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 4, background: loraStatus === "done" ? "linear-gradient(90deg, #4caf50, #43e97b)" : "linear-gradient(90deg, #ffd700, #ff9a9e)", width: loraStatus === "done" || loraStatus === "error" ? "100%" : "5%", animation: loraStatus === "loading" ? "fwdBar 150s linear forwards" : "none", transition: "width 0.5s" }} />
                        </div>
                        {loraStatus === "loading" && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "5px 0 0" }}>This creates a truly personalised character — please wait</p>}
                      </div>
                      {loraStatus === "loading" && <div style={{ width: 20, height: 20, border: "2.5px solid rgba(255,215,0,0.2)", borderTop: "2.5px solid #ffd700", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                      {loraStatus === "done"    && <div style={{ fontSize: 22, flexShrink: 0 }}>✅</div>}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
                  {THEMES.map((t) => (
                    <div key={t.id} className="theme-card" onClick={() => setTheme(t.id)} style={{ position: "relative", padding: "22px 18px 18px", borderRadius: 20, cursor: "pointer", border: `2px solid ${theme === t.id ? "#ffd700" : "rgba(255,255,255,0.1)"}`, background: theme === t.id ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.04)", boxShadow: theme === t.id ? "0 0 24px rgba(255,215,0,0.18)" : "0 2px 8px rgba(0,0,0,0.2)" }}>
                      {t.popular && <div style={{ position: "absolute", top: -10, right: 12, background: "linear-gradient(135deg, #ff6b6b, #ee5a24)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em" }}>⭐ MOST POPULAR</div>}
                      <div style={{ fontSize: 44, marginBottom: 11 }}>{t.emoji}</div>
                      <div style={{ color: theme === t.id ? "#ffd700" : "white", fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{t.title}</div>
                      <div style={{ color: theme === t.id ? "rgba(255,215,0,0.65)" : "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 9 }}>{t.subtitle}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                  <button onClick={() => goToStep(3)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => goToStep(5)} style={{ flex: 1, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                    Preview your story →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: Preview ── */}
            {onboardingStep === 5 && (
              <div>
                {/* Full-screen loading — shown until ALL scenes done */}
                {previewStatus !== "done" && (
                  <div style={{ textAlign: "center", padding: isMobile ? "56px 20px" : "72px 32px", background: "rgba(255,255,255,0.04)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: 64, marginBottom: 18, animation: "float 2s ease-in-out infinite" }}>🪄</div>
                    <h2 style={{ color: "white", fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: "0 0 12px" }}>Creating your story...</h2>
                    <p style={{ color: "rgba(255,215,0,0.85)", fontSize: 15, fontWeight: 600, margin: "0 0 32px", minHeight: 24 }}>{previewMsg}</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "pulseDot 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                )}

                {/* Rate limit reached */}
                {previewStatus === "done" && previewStory?._limitReached && (
                  <div style={{ textAlign: "center", padding: isMobile ? "40px 20px" : "56px 32px", background: "rgba(255,255,255,0.04)", borderRadius: 24, border: "1px solid rgba(255,100,100,0.2)" }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
                    <h2 style={{ color: "white", fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: "0 0 10px" }}>Free preview limit reached</h2>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 24px" }}>You've used 3 free previews in 24 hours. Purchase once to unlock unlimited generations.</p>
                    <button onClick={() => handlePurchase("digital")} style={{ padding: "15px 36px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
                      Unlock My Book — $17.99 →
                    </button>
                  </div>
                )}

                {/* Revealed preview — fades in once ALL 7 done */}
                {previewStatus === "done" && previewStory && !previewStory._limitReached && (
                  <div style={{ animation: "fadeIn 0.7s ease both" }}>
                    <Mascot msg={`Here's a sneak peek of ${childName || "your child"}'s story! 🎉`} />

                    {/* Cover thumbnail */}
                    {previewCoverUrl && (
                      <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", marginBottom: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
                        <img src={previewCoverUrl} alt="Book cover" style={{ width: "100%", height: isMobile ? 180 : 220, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 40%, rgba(0,0,0,0.15) 100%)" }} />
                        <div style={{ position: "absolute", bottom: 16, left: 18, right: 18 }}>
                          <div style={{ color: "#ffd700", fontWeight: 800, fontSize: isMobile ? 16 : 19, textShadow: "0 2px 8px rgba(0,0,0,0.6)", marginBottom: 3 }}>{previewStory.title}</div>
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontStyle: "italic" }}>{previewStory.dedication}</div>
                        </div>
                        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,215,0,0.95)", borderRadius: 8, padding: "3px 9px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ Cover</div>
                      </div>
                    )}

                    {/* Pages 1 & 2 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
                      {previewStory.pages.slice(0, 2).map((page: any, idx: number) => {
                        const img = previewImages[idx];
                        return (
                          <div key={idx} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", display: "flex", flexDirection: isMobile ? "column" : "row" }}>
                            <div style={{ flex: isMobile ? undefined : "0 0 45%", aspectRatio: isMobile ? "4/2.5" : undefined, minHeight: isMobile ? undefined : 180, background: "#1a1a2e", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                              {img && <img src={img} alt={`Page ${page.pageNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                              <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", borderRadius: 8, padding: "2px 8px", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700 }}>Page {page.pageNum}</div>
                              <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,215,0,0.95)", borderRadius: 8, padding: "2px 8px", color: "#1a0a2e", fontSize: 10, fontWeight: 700 }}>✨ AI Scene</div>
                            </div>
                            <div style={{ flex: 1, padding: "18px 20px", background: "#fff8f0", display: "flex", alignItems: "center" }}>
                              <p style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: "#3d2b1f", margin: 0 }}>{page.text}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Locked pages 3-6 */}
                      <div style={{ position: "relative" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
                          {previewStory.pages.slice(2).map((page: any, idx: number) => {
                            const img = previewImages[idx + 2];
                            return (
                              <div key={idx} style={{ background: "white", borderRadius: 14, overflow: "hidden", height: 90, display: "flex" }}>
                                <div style={{ flex: "0 0 40%", background: img ? "#1a1a2e" : PAGE_BACKGROUNDS[(idx + 2) % PAGE_BACKGROUNDS.length], position: "relative", overflow: "hidden" }}>
                                  {img && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                </div>
                                <div style={{ flex: 1, background: "#fff8f0", padding: "14px 16px" }}>
                                  <div style={{ height: 10, background: "#e0d4c8", borderRadius: 5, marginBottom: 8, width: "80%" }} />
                                  <div style={{ height: 10, background: "#e0d4c8", borderRadius: 5, width: "55%" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(26,10,46,0.72)", borderRadius: 14, backdropFilter: "blur(2px)" }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
                          <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: "0 0 3px", textAlign: "center" }}>Pages 3–6 are waiting!</p>
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>Unlock your full story below</p>
                        </div>
                      </div>
                    </div>

                    {/* Email lead capture */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 18px", marginBottom: 14, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "white", fontWeight: 600, fontSize: 13, margin: "0 0 3px" }}>📧 Email me my preview link</p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>Save it to come back and purchase later</p>
                      </div>
                      {leadSent ? (
                        <div style={{ color: "#4caf50", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✓ Sent!</div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <input value={leadEmail} onChange={e => setLeadEmail(e.target.value)} type="email" placeholder="your@email.com"
                            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 13, width: 180 }} />
                          <button onClick={submitLeadEmail} disabled={leadSending || !leadEmail} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: leadEmail ? "linear-gradient(135deg, #ffd700, #ff9a9e)" : "rgba(255,255,255,0.1)", color: leadEmail ? "#1a0a2e" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 13, cursor: leadEmail ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                            {leadSending ? "…" : "Send →"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CTAs */}
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 22, padding: isMobile ? 18 : 24 }}>
                      <p style={{ color: "rgba(255,215,0,0.9)", fontSize: 13, fontWeight: 700, textAlign: "center", margin: "0 0 4px", letterSpacing: "0.04em" }}>✨ Your story is being crafted with care</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", margin: "0 0 18px" }}>6 personalised cinematic 3D-illustrated pages starring {childName || "your child"}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <button onClick={() => handlePurchase("digital")} disabled={!!checkoutLoading} style={{ width: "100%", padding: "17px", borderRadius: 16, border: "none", background: checkoutLoading === "digital" ? "rgba(255,215,0,0.5)" : "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 17, fontWeight: 800, cursor: checkoutLoading ? "not-allowed" : "pointer" }}>
                          {checkoutLoading === "digital" ? "Redirecting..." : PAYMENTS_ENABLED ? "Get Digital Book — $17.99 →" : "✨ Create My Storybook!"}
                        </button>
                        {PAYMENTS_ENABLED && (
                          <button onClick={() => handlePurchase("print")} disabled={!!checkoutLoading} style={{ width: "100%", padding: "15px", borderRadius: 16, border: "2px solid rgba(255,215,0,0.35)", background: "rgba(255,215,0,0.07)", color: "#ffd700", fontSize: 16, fontWeight: 700, cursor: checkoutLoading ? "not-allowed" : "pointer" }}>
                            {checkoutLoading === "print" ? "Redirecting..." : "🖨️ Print + Digital — $37.99"}
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 10 : 20, marginTop: 14, flexWrap: "wrap" }}>
                        {["🔒 Secure checkout", "📥 Instant download", "🔄 30-day guarantee"].map(t => (
                          <span key={t} style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => goToStep(4)} style={{ display: "block", margin: "14px auto 0", padding: "8px 16px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}>← Change adventure</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ GENERATING ══════════════════════════════════════════════════════════ */}
      {mainStep === "generating" && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both", maxWidth: 400, width: "100%", padding: "0 16px" }}>
          <div style={{ fontSize: 72, marginBottom: 20, animation: "float 2s ease-in-out infinite" }}>🪄</div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Creating your magical book...</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 8px" }}>{loadingMsg}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 24px" }}>Painting your cover and 6 unique illustrated scenes</p>
          {scenesCompleted > 0 && (
            <div style={{ maxWidth: 260, margin: "0 auto 24px" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #ffd700, #ff9a9e)", width: `${(scenesCompleted / 7) * 100}%`, transition: "width 0.4s ease" }} />
              </div>
              <p style={{ color: "rgba(255,215,0,0.7)", fontSize: 12, marginTop: 7 }}>{scenesCompleted} of 7 illustrations painted</p>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "pulseDot 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      )}

      {/* ══ BOOK ════════════════════════════════════════════════════════════════ */}
      {mainStep === "book" && story && (
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 880, animation: "fadeUp 0.5s ease both" }}>
          {falError    && <div style={{ background: "rgba(255,100,100,0.09)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: 10, padding: "9px 14px", marginBottom: 12, color: "#ffaaaa", fontSize: 13, textAlign: "center" }}>⚠️ {falError}</div>}
          {isSharedView && <div style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, color: "rgba(255,215,0,0.8)", fontSize: 13, textAlign: "center" }}>📖 Viewing a shared storybook</div>}
          {isDemo && <div style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.35)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, color: "#ffd700", fontSize: 13, textAlign: "center", fontWeight: 600 }}>⚡ Demo Mode — no credits used · <a href="/create" style={{ color: "#ffd700", textDecoration: "underline", cursor: "pointer" }} onClick={e => { e.preventDefault(); resetAll(); }}>Create your own</a></div>}

          {(() => {
            // Capitalise first letter of child's name for display
            const capName = childName
              ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
              : "You";
            return null;
          })()}
          {currentPage === -2 ? (
            // ── BOOK COVER — illustration top, title banner bottom ────────────
            <div style={{ borderRadius: isMobile ? 16 : 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.12)", animation: "fadeUp 0.4s ease both", display: "flex", flexDirection: "column", minHeight: isMobile ? 420 : 560 }}>
              {/* Illustration: explicit pixel height so browser allocates space before image loads */}
              <div style={{ width: "100%", height: isMobile ? 240 : 320, position: "relative", overflow: "hidden", display: "block", backgroundColor: "#2D1B69" }}>
                <img
                  src={pageImages[0] || undefined}
                  alt="Book cover"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to bottom, transparent, rgba(13,7,30,0.75))" }} />
              </div>
              {/* Title banner */}
              <div style={{ background: "linear-gradient(160deg, #0d071e 0%, #2D1B69 60%, #150d28 100%)", borderTop: "1.5px solid rgba(255,215,0,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "20px 22px 22px" : "28px 48px 28px", textAlign: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "linear-gradient(135deg, #F5A623, #ffb347)", borderRadius: 50, padding: "5px 16px", boxShadow: "0 3px 12px rgba(0,0,0,0.4)" }}>
                  <span style={{ fontSize: 12 }}>✨</span>
                  <span style={{ color: "#1a0a2e", fontWeight: 800, fontSize: 11, letterSpacing: "0.05em" }}>My Tiny Tales</span>
                </div>
                <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "white", fontSize: "clamp(22px, 5vw, 42px)", fontWeight: 900, margin: 0, lineHeight: 1.15, letterSpacing: "-0.01em", textShadow: "0 2px 20px rgba(0,0,0,0.7)", wordBreak: "break-word" }}>
                  {story.title}
                </h1>
                <p style={{ color: "rgba(255,215,0,0.7)", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: isMobile ? 13 : 15, margin: 0, letterSpacing: "0.03em" }}>
                  {THEMES.find(t => t.id === theme)?.subtitle ?? story.dedication}
                </p>
              </div>
            </div>
          ) : currentPage === -1 ? (
            // ── DEDICATION PAGE ──────────────────────────────────────────────────
            <DarkFrame>
              {(() => {
                const capName = childName
                  ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
                  : "You";
                return (
                  <>
                    <p style={{ color: "rgba(255,215,0,0.6)", fontSize: isMobile ? 10 : 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 20px", fontFamily: "Georgia, serif" }}>
                      This story was created especially for
                    </p>
                    <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "white", fontSize: isMobile ? 40 : 56, fontWeight: 900, margin: "0 0 24px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                      {capName}
                    </h1>
                    <div style={{ height: 1, background: "rgba(255,215,0,0.25)", maxWidth: 240, margin: "0 auto 24px" }} />
                    <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "rgba(255,255,255,0.78)", fontSize: isMobile ? 14 : 17, lineHeight: 1.9, fontStyle: "italic", margin: "0 0 32px" }}>
                      "May every adventure remind you how loved, brave, and magical you are."
                    </p>
                    <p style={{ color: "rgba(255,215,0,0.4)", fontFamily: "Georgia, serif", fontSize: 12, letterSpacing: "0.16em", margin: 0 }}>✦ My Tiny Tales ✦</p>
                  </>
                );
              })()}
            </DarkFrame>
          ) : currentPage < totalPages ? (
            // ── STORY SPREADS ────────────────────────────────────────────────────
            <div key={`spread-${currentPage}`} style={{ borderRadius: isMobile ? 12 : 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.08)", animation: `${navDir === "fwd" ? "slideInFwd" : "slideInBack"} 0.25s ease both` }}>
              <BookSpread spreadIndex={currentPage} />
            </div>
          ) : (
            // ── CLOSING KEEPSAKE PAGE ────────────────────────────────────────────
            <DarkFrame>
              {(() => {
                const capName = childName
                  ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
                  : "";
                const closingText = THEME_CLOSING[theme]?.(capName) ||
                  `Remember, ${capName}: every great adventure begins with one brave step. The world is full of magic — and you have everything it takes to find it.`;
                return (
                  <>
                    <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: "rgba(255,215,0,0.82)", fontSize: isMobile ? 15 : 19, lineHeight: 1.95, fontStyle: "italic", margin: "0 0 28px" }}>
                      {closingText}
                    </p>
                    <div style={{ height: 1, background: "rgba(255,215,0,0.22)", maxWidth: 200, margin: "0 auto 20px" }} />
                    <p style={{ color: "rgba(255,215,0,0.6)", fontFamily: "Georgia, serif", fontSize: isMobile ? 18 : 24, letterSpacing: "0.1em", margin: "0 0 20px" }}>✦ The End ✦</p>
                    <p style={{ color: "rgba(255,255,255,0.28)", fontFamily: "Georgia, serif", fontSize: 12, fontStyle: "italic", margin: "0 0 16px" }}>
                      Created with love · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p style={{ color: "rgba(255,215,0,0.35)", fontFamily: "Georgia, serif", fontSize: 11, letterSpacing: "0.16em", margin: 0 }}>✦ My Tiny Tales ✦</p>
                  </>
                );
              })()}
            </DarkFrame>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 10 : 16, marginTop: 18 }}>
            <button onClick={() => navigate(Math.max(-2, currentPage - 1))} disabled={currentPage === -2} style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 14, cursor: currentPage === -2 ? "not-allowed" : "pointer", opacity: currentPage === -2 ? 0.3 : 1 }}>← Prev</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Cover dot */}
              <div onClick={() => navigate(-2)} title="Cover" style={{ width: currentPage === -2 ? 10 : 6, height: currentPage === -2 ? 10 : 6, borderRadius: "50%", background: currentPage === -2 ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
              {/* Dedication dot */}
              <div onClick={() => navigate(-1)} title="Dedication" style={{ width: currentPage === -1 ? 10 : 6, height: currentPage === -1 ? 10 : 6, borderRadius: "50%", background: currentPage === -1 ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
              {/* Page dots */}
              {story.pages.map((_: any, i: number) => (
                <div key={i} onClick={() => navigate(i)} title={`Page ${i + 1}`} style={{ width: currentPage === i ? 10 : 6, height: currentPage === i ? 10 : 6, borderRadius: "50%", background: currentPage === i ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
              {/* Closing dot */}
              <div onClick={() => navigate(totalPages)} title="The End" style={{ width: currentPage === totalPages ? 10 : 6, height: currentPage === totalPages ? 10 : 6, borderRadius: "50%", background: currentPage === totalPages ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
            </div>
            <button onClick={() => navigate(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #F5A623, #ffb347)", color: "#1a0a2e", fontSize: 14, fontWeight: 600, cursor: currentPage >= totalPages ? "not-allowed" : "pointer", opacity: currentPage >= totalPages ? 0.4 : 1 }}>Next →</button>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={printBook} style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #F5A623, #ffb347)", color: "#1a0a2e", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              🖨️ Print / Save PDF
            </button>
            <button onClick={copyShareLink} style={{ padding: "10px 20px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: shareCopied ? "linear-gradient(135deg, #667eea, #764ba2)" : "rgba(255,255,255,0.1)", color: shareCopied ? "white" : "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}>
              {shareCopied ? "✓ Link Copied!" : "🔗 Share Book"}
            </button>
            <button onClick={() => setShowNewBookConfirm(true)} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>+ New Book</button>
            {isDemo && (
              <button
                onClick={async () => {
                  setKontextLoading(true);
                  setKontextResult(null);
                  try {
                    const res = await fetch("/api/test-kontext", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        imageUrl: kontextImageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
                        prompt: "Child in a magical jungle with a golden crown, cinematic 3D-style illustration, warm lighting, storybook atmosphere, no text in image",
                      }),
                    });
                    const data = await res.json();
                    if (data.url) setKontextResult(data.url);
                    else setKontextResult("error");
                  } catch { setKontextResult("error"); }
                  finally { setKontextLoading(false); }
                }}
                disabled={kontextLoading}
                style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid rgba(255,215,0,0.4)", background: "rgba(244,196,48,0.12)", color: "#ffd700", fontSize: 13, fontWeight: 600, cursor: kontextLoading ? "not-allowed" : "pointer", opacity: kontextLoading ? 0.6 : 1 }}
              >
                {kontextLoading ? "⏳ Testing Kontext…" : "🧪 Test Kontext"}
              </button>
            )}
          </div>

          {/* Kontext image URL input (demo only) */}
          {isDemo && (
            <div style={{ margin: "12px auto 0", maxWidth: 680, display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="url"
                value={kontextImageUrl}
                onChange={e => setKontextImageUrl(e.target.value)}
                placeholder="Paste a photo URL to test with (optional)"
                style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(255,215,0,0.25)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 13, outline: "none" }}
              />
              {kontextImageUrl && (
                <button onClick={() => setKontextImageUrl("")} style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>✕</button>
              )}
            </div>
          )}

          {/* Kontext test result (demo only) */}
          {isDemo && kontextResult && (
            <div style={{ margin: "16px auto 0", maxWidth: 680, background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(255,215,0,0.2)" }}>
              <p style={{ color: "#ffd700", fontWeight: 700, fontSize: 14, margin: "0 0 14px" }}>🧪 fal-ai/flux-pro/kontext — reference-image guided (no LoRA)</p>
              {kontextResult === "error" ? (
                <p style={{ color: "#ff6b6b", fontSize: 14, margin: 0 }}>Generation failed. Check FAL_API_KEY and that fal-ai/flux-pro/kontext is available on your plan.</p>
              ) : (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 8px" }}>Kontext output</p>
                    <img src={kontextResult} alt="Kontext result" style={{ width: "100%", borderRadius: 10, display: "block" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 8px" }}>Reference photo used</p>
                    <img src={kontextImageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800"} alt="Reference" style={{ width: "100%", borderRadius: 10, display: "block" }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Book confirmation modal */}
          {showNewBookConfirm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowNewBookConfirm(false)}>
              <div style={{ background: "linear-gradient(160deg, #1a0a2e, #2d1b4e)", borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%", border: "1px solid rgba(255,215,0,0.2)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📖</div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: 18, margin: "0 0 10px" }}>Start a new book?</h3>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>Your current book will be lost.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowNewBookConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={resetAll} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Yes, start over</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Print-only book pages (hidden on screen, shown on print) ── */}
      {mainStep === "book" && story && (
        <div id="print-book-root">

          {/* Page 1: Cover (front of book) */}
          <div className="print-page print-page-col" style={{ background: "#0d071e" }}>
            <div style={{ flex: "0 0 60%", width: "100%", position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #1a0a2e, #4a2060, #1a3040)" }}>
              {coverImageUrl && <img crossOrigin="anonymous" src={coverImageUrl} alt="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
            </div>
            <div style={{ flex: "0 0 40%", background: "linear-gradient(160deg, #0d071e, #2D1B69, #150d28)", borderTop: "1.5px solid rgba(255,215,0,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, padding: "20px 80px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #ffd700, #ffb347)", borderRadius: 50, padding: "5px 16px" }}>
                <span>✨</span><span style={{ color: "#1a0a2e", fontWeight: 800, fontSize: 12 }}>My Tiny Tales</span>
              </div>
              <div style={{ color: "white", fontSize: 38, fontWeight: 900, fontFamily: "Georgia, serif", lineHeight: 1.15 }}>{story.title}</div>
              <div style={{ color: "rgba(255,215,0,0.7)", fontStyle: "italic", fontSize: 15, fontFamily: "Georgia, serif" }}>{THEMES.find(t => t.id === theme)?.subtitle ?? story.dedication}</div>
            </div>
          </div>

          {/* Page 2: Blank verso (inside front cover — standard in printed books) */}
          <div className="print-page" style={{ background: "#0d071e" }} />

          {/* Page 3: Dedication */}
          <div className="print-page" style={{ background: "linear-gradient(160deg, #0d071e 0%, #2D1B69 50%, #0d071e 100%)", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", inset: 40, border: "1.5px solid rgba(255,215,0,0.35)", borderRadius: 10, pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 60, border: "0.5px solid rgba(255,215,0,0.15)", borderRadius: 6, pointerEvents: "none" }} />
            <div style={{ textAlign: "center", maxWidth: 600, position: "relative", zIndex: 1 }}>
              <p style={{ color: "rgba(255,215,0,0.6)", fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 20px", fontFamily: "Georgia, serif" }}>
                This story was created especially for
              </p>
              <h1 style={{ fontFamily: "Georgia, serif", color: "white", fontSize: 72, fontWeight: 900, margin: "0 0 24px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
                {childName ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase() : "You"}
              </h1>
              <div style={{ height: 1, background: "rgba(255,215,0,0.25)", maxWidth: 240, margin: "0 auto 24px" }} />
              <p style={{ fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.78)", fontSize: 20, lineHeight: 1.9, fontStyle: "italic", margin: "0 0 32px" }}>
                "May every adventure remind you how loved, brave, and magical you are."
              </p>
              <p style={{ color: "rgba(255,215,0,0.4)", fontFamily: "Georgia, serif", fontSize: 13, letterSpacing: "0.16em", margin: 0 }}>✦ My Tiny Tales ✦</p>
            </div>
          </div>

          {/* Pages 4–9: Story spreads — one page per spread */}
          {story.pages.map((_: any, i: number) => (
            <div key={i} className="print-page">
              <BookSpread spreadIndex={i} />
            </div>
          ))}

          {/* Page 10: Closing keepsake */}
          {(() => {
            const capName = childName
              ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
              : "";
            const closingText = THEME_CLOSING[theme]?.(capName) ||
              `Remember, ${capName}: every great adventure begins with one brave step. The world is full of magic — and you have everything it takes to find it.`;
            return (
              <div className="print-page" style={{ background: "linear-gradient(160deg, #0d071e 0%, #2D1B69 50%, #0d071e 100%)", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ position: "absolute", inset: 40, border: "1.5px solid rgba(255,215,0,0.35)", borderRadius: 10, pointerEvents: "none" }} />
                <div style={{ position: "absolute", inset: 60, border: "0.5px solid rgba(255,215,0,0.15)", borderRadius: 6, pointerEvents: "none" }} />
                <div style={{ textAlign: "center", maxWidth: 680, position: "relative", zIndex: 1 }}>
                  <p style={{ fontFamily: "Georgia, serif", color: "rgba(255,215,0,0.82)", fontSize: 22, lineHeight: 1.95, fontStyle: "italic", margin: "0 0 32px" }}>
                    {closingText}
                  </p>
                  <div style={{ height: 1, background: "rgba(255,215,0,0.22)", maxWidth: 200, margin: "0 auto 20px" }} />
                  <p style={{ color: "rgba(255,215,0,0.6)", fontFamily: "Georgia, serif", fontSize: 28, letterSpacing: "0.1em", margin: "0 0 24px" }}>✦ The End ✦</p>
                  <p style={{ color: "rgba(255,255,255,0.28)", fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", margin: "0 0 16px" }}>
                    Created with love · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p style={{ color: "rgba(255,215,0,0.35)", fontFamily: "Georgia, serif", fontSize: 12, letterSpacing: "0.16em", margin: 0 }}>✦ My Tiny Tales ✦</p>
                </div>
              </div>
            );
          })()}

          {/* Page 11: Blank inside back cover (print/hardcover only) */}
          <div className="print-page" style={{ background: "#0d071e" }} />

        </div>
      )}
    </div>
  );
}
