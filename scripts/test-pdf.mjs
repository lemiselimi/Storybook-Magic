// Offline proof using the production renderer. No AI, uploads or print orders.
// Usage: node scripts/test-pdf.mjs <output-directory>
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { renderBookPdf } from "../lib/book-pdf.js";

const out = path.resolve(process.argv[2] || "tmp/pdf-review");
await fs.mkdir(out, { recursive: true });
const story = JSON.parse(await fs.readFile(new URL("../test/fixtures/loli-read-aloud.json", import.meta.url), "utf8"));
const xml = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
async function briefPlate(brief, label) {
  const words = brief.split(/\s+/), lines = [];
  while (words.length) lines.push(words.splice(0, 9).join(" "));
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><rect width="1200" height="1200" fill="#e8e4d8"/><text x="110" y="190" font-family="sans-serif" font-size="24" fill="#7b4435">LAYOUT REVIEW — ARTWORK PENDING</text><text x="110" y="280" font-family="serif" font-size="46" fill="#1f2a28">${xml(label)}</text>${lines.map((line, i) => `<text x="110" y="${370 + i * 54}" font-family="sans-serif" font-size="30" fill="#1f2a28">${xml(line)}</text>`).join("")}</svg>`)).png().toBuffer();
}
const coverBytes = await briefPlate("Cover art will show Loli and the little bubble friend together. This proof checks the new typography and physical page order.", "Cover illustration brief");
const sceneBytes = await Promise.all(story.pages.map(p => briefPlate(p.illustration, `Scene ${p.pageNum}`)));
const result = await renderBookPdf({ story, childName: "Loli", coverBytes, sceneBytes });
await fs.writeFile(path.join(out, "loli-layout-review.pdf"), result.interiorPdfBytes);
await fs.writeFile(path.join(out, "loli-revised-story.md"), `# ${story.title}\n\n${story.dedication}\n\n${story.pages.map(p => `## Spread ${p.pageNum}\n\n${p.text}\n\n**Illustration:** ${p.illustration}`).join("\n\n")}\n`);
console.log(`Wrote ${result.pagePlan.length}-page offline proof and revised manuscript to ${out}. Illustration brief plates are not final artwork.`);
