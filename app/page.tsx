"use client";
import { useState, useRef, useCallback } from "react";

const THEMES = [
  { id: "adventure", label: "🗺️ Adventure", desc: "Epic quests & exploration" },
  { id: "animals", label: "🦁 Animal Friends", desc: "Talking creatures & wild places" },
  { id: "space", label: "🚀 Space Explorer", desc: "Stars, planets & galaxies" },
  { id: "magic", label: "✨ Magic Kingdom", desc: "Spells, fairies & enchantment" },
  { id: "ocean", label: "🐠 Under the Sea", desc: "Mermaids & ocean mysteries" },
  { id: "dinosaurs", label: "🦕 Dino World", desc: "Prehistoric adventures" },
];

export default function StorybookCreator() {
  const [step, setStep] = useState("upload");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [cartoonUrls, setCartoonUrls] = useState<string[]>([]);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [theme, setTheme] = useState("adventure");
  const [story, setStory] = useState<any>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [currentPage, setCurrentPage] = useState(-1);
  const [falError, setFalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPhoto(url);
    setCartoonUrls([]);
    setFalError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoBase64((e.target?.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const getFallbackStory = () => ({
    title: `${childName || "A Child"}'s Big Adventure`,
    dedication: `For ${childName || "every child"} who dares to dream`,
    pages: [
      { pageNum: 1, text: `Once upon a time, ${childName || "our hero"} woke up to find a magical map under their pillow.`, illustration: `${childName} sitting in bed holding a glowing treasure map, bedroom with stars outside the window` },
      { pageNum: 2, text: `${childName || "Our hero"} packed a backpack and set off. "I'm ready!" they cheered.`, illustration: `${childName} standing at front door in explorer gear with backpack, sunny day outside` },
      { pageNum: 3, text: `The path led through an enchanted forest full of friendly butterflies.`, illustration: `${childName} walking through a magical glowing forest with giant colorful butterflies` },
      { pageNum: 4, text: `Deep in the forest they found a tiny dragon who had lost his fire.`, illustration: `${childName} kneeling next to a small cute sad dragon in a sunny forest clearing` },
      { pageNum: 5, text: `${childName || "Our hero"} told a joke and WHOOOOSH flames burst out! "You fixed me!"`, illustration: `${childName} laughing with a happy dragon shooting colorful fire into the sky` },
      { pageNum: 6, text: `The dragon flew them home under the stars. "Best day ever," they whispered.`, illustration: `${childName} riding a friendly dragon through a beautiful starry night sky toward home` },
    ],
  });

  const generateBook = async () => {
    setStep("generating");
    setFalError(null);

    try {
      const selectedTheme = THEMES.find((t) => t.id === theme);

      // Step 1: Generate story
      setLoadingMsg("Writing your personalized story... 📖");
      const storyRes = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, childAge, theme: `${selectedTheme?.label} - ${selectedTheme?.desc}` }),
      });
      const storyData = storyRes.ok ? await storyRes.json() : getFallbackStory();

      // Step 2: Generate one image per page
      const images: string[] = [];
      for (let p = 0; p < storyData.pages.length; p++) {
        const page = storyData.pages[p];
        setLoadingMsg(`Illustrating page ${p + 1} of ${storyData.pages.length}... 🎨`);
        try {
          const imgRes = await fetch("/api/cartoonify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: photoBase64, illustration: page.illustration }),
          });
          const imgData = await imgRes.json();
          images.push(imgData.url || photo as string);
        } catch {
          images.push(photo as string);
        }
      }

      setCartoonUrls(images);
      setStory(storyData);
      setCurrentPage(-1);
      setStep("book");
    } catch (err) {
      console.error(err);
      setStory(getFallbackStory());
      setCurrentPage(-1);
      setStep("book");
    }
  };

  const BookPage = ({ page, isLeft }: { page: any; isLeft: boolean }) => {
    const pageImage = cartoonUrls[page.pageNum - 1] || photo;
    return (
      <div style={{ flex: 1, padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 0, background: isLeft ? "#fffef7" : "#fff8f0", borderRight: isLeft ? "2px solid #e8dcc8" : "none" }}>
        {isLeft ? (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "100%", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg, #ffecd2, #fcb69f, #ffeaa7)", border: "3px solid #f0d5b0", position: "relative" }}>
                {pageImage && <img src={pageImage} alt="illustration" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {cartoonUrls.length > 0 && <div style={{ position: "absolute", top: 8, right: 8, borderRadius: 8, background: "rgba(255,215,0,0.9)", padding: "3px 8px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ Pixar Style</div>}
              </div>
            </div>
            <div style={{ textAlign: "center", color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 13, marginTop: 12 }}>— {page.pageNum} —</div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1.85, color: "#3d2b1f", margin: 0 }}>{page.text}</p>
            </div>
            <div style={{ textAlign: "center", color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 13, marginTop: 12 }}>— {page.pageNum + 1} —</div>
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
              <div style={{ width: 100 }}>
                <label style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>AGE</label>
                <input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="5" type="number" style={{ width: "100%", padding: "11px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 15, boxSizing: "border-box" }} />
              </div>
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
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
            <button onClick={() => setStep("upload")} style={{ padding: "13px 22px", borderRadius: 13, border: "1px solid rgba(255,255,255,0.13)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>← Back</button>
            <button onClick={generateBook} style={{ flex: 1, padding: "15px", borderRadius: 13, border: "none", background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>✨ Create My Storybook!</button>
          </div>
        </div>
      )}

      {step === "generating" && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both", maxWidth: 400 }}>
          <div style={{ fontSize: 76, marginBottom: 22, animation: "float 2s ease-in-out infinite" }}>🪄</div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Creating your magical book...</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 8px" }}>{loadingMsg}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 28px" }}>This takes 2-3 minutes — we're creating 6 unique illustrations!</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "float 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      )}

      {step === "book" && story && (
        <div style={{ width: "100%", maxWidth: 880, animation: "fadeUp 0.5s ease both" }}>
          {falError && <div style={{ background: "rgba(255,100,100,0.09)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: 10, padding: "9px 14px", marginBottom: 14, color: "#ffaaaa", fontSize: 13, textAlign: "center" }}>⚠️ {falError}</div>}

          {currentPage === -1 ? (
            <div style={{ background: "linear-gradient(135deg, #2d1b4e, #4a2060)", borderRadius: 20, padding: "56px 40px", textAlign: "center", border: "2px solid rgba(255,215,0,0.28)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              {(cartoonUrls[0] || photo) && <img src={cartoonUrls[0] || photo as string} alt="hero" style={{ width: 148, height: 148, objectFit: "cover", borderRadius: 16, border: "5px solid #ffd700", marginBottom: 20 }} />}
              {cartoonUrls.length > 0 && <div style={{ marginBottom: 14 }}><span style={{ background: "rgba(255,215,0,0.18)", border: "1px solid rgba(255,215,0,0.35)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#ffd700", fontWeight: 600 }}>✨ 6 unique Pixar illustrations</span></div>}
              <h1 style={{ color: "#ffd700", fontSize: 30, fontWeight: 800, margin: "0 0 10px" }}>{story.title}</h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontStyle: "italic", fontSize: 15, margin: "0 0 24px" }}>{story.dedication}</p>
              <button onClick={() => setCurrentPage(0)} style={{ padding: "11px 30px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Open Book →</button>
            </div>
          ) : (
            <div style={{ display: "flex", background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", minHeight: 400 }}>
              {story.pages[currentPage * 2] && <BookPage page={story.pages[currentPage * 2]} isLeft={true} />}
              {story.pages[currentPage * 2 + 1]
                ? <BookPage page={story.pages[currentPage * 2 + 1]} isLeft={false} />
                : <div style={{ flex: 1, background: "#fff8f0", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#c4a882", fontFamily: "Georgia, serif", fontSize: 20, fontStyle: "italic" }}>The End 🌟</p></div>
              }
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 22 }}>
            <button onClick={() => setCurrentPage(p => Math.max(-1, p - 1))} disabled={currentPage === -1} style={{ padding: "11px 22px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 14, cursor: currentPage === -1 ? "not-allowed" : "pointer", opacity: currentPage === -1 ? 0.3 : 1 }}>← Prev</button>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{currentPage === -1 ? "Cover" : `Pages ${currentPage * 2 + 1}–${Math.min(currentPage * 2 + 2, story.pages.length)}`} of {story.pages.length}</div>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(story.pages.length / 2) - 1, p + 1))} disabled={currentPage >= Math.ceil(story.pages.length / 2) - 1} style={{ padding: "11px 22px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 14, fontWeight: 600, cursor: currentPage >= Math.ceil(story.pages.length / 2) - 1 ? "not-allowed" : "pointer", opacity: currentPage >= Math.ceil(story.pages.length / 2) - 1 ? 0.4 : 1 }}>Next →</button>
          </div>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button onClick={() => { setStep("upload"); setPhoto(null); setCartoonUrls([]); setStory(null); }} style={{ padding: "9px 22px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.42)", fontSize: 13, cursor: "pointer" }}>+ Create Another Book</button>
          </div>
        </div>
      )}
    </div>
  );
}
