const BASE = "https://mytinytales.studio";

async function generate(ageBand) {
  const res = await fetch(`${BASE}/api/story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      childName: "Lily",
      childAge: ageBand === "1-3" ? "2" : ageBand === "4-6" ? "5" : ageBand === "7-9" ? "8" : "11",
      gender: "girl",
      themeId: "worldcup",
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const bands = ["1-3", "4-6", "7-9", "10-12"];
console.log("Generating 4 stories in parallel...\n");
const results = await Promise.all(bands.map(b => generate(b)));

for (let i = 0; i < bands.length; i++) {
  const r = results[i];
  const wordCount = r.pages?.map(p => p.text.split(" ").length).reduce((a,b)=>a+b,0) ?? 0;
  console.log(`\n${"═".repeat(72)}`);
  console.log(`AGE BAND ${bands[i]}  |  "${r.title}"  |  ~${wordCount} words total`);
  console.log(`${"═".repeat(72)}`);
  for (const p of (r.pages || [])) {
    console.log(`\n[Page ${p.pageNum}]  ${p.text}`);
  }
}
