/**
 * Local PDF test script — run with:
 *   node scripts/test-pdf.mjs
 *
 * Generates test-cover.pdf and test-interior.pdf in the project root.
 * Open in Adobe Reader → File → Properties → Fonts.
 * Every font must show "Embedded Subset" — if any shows "Not Embedded", the print bug is still present.
 */

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const OUT       = ROOT;

// ── Dimensions (must match generate-book-pdf/route.js exactly) ───────────────
const PS    = 584;
const SPINE = 7;
const CW    = PS * 2 + SPINE;
const CH    = PS;
const M     = 36;

const DARK  = rgb(0.06,  0.04,  0.14);
const CREAM = rgb(0.992, 0.973, 0.937);
const BROWN = rgb(0.165, 0.082, 0.020);
const GOLD  = rgb(0.910, 0.753, 0.478);
const WHITE = rgb(1, 1, 1);

// ── Font loading ──────────────────────────────────────────────────────────────
const FONT_DIR = path.join(ROOT, "node_modules");
const BOLD_BYTES    = fs.readFileSync(path.join(FONT_DIR, "@fontsource/lato/files/lato-latin-700-normal.woff"));
const REGULAR_BYTES = fs.readFileSync(path.join(FONT_DIR, "@fontsource/libre-baskerville/files/libre-baskerville-latin-400-normal.woff"));
const ITALIC_BYTES  = fs.readFileSync(path.join(FONT_DIR, "@fontsource/libre-baskerville/files/libre-baskerville-latin-400-italic.woff"));

function wrapText(text, maxChars = 60) {
  const words = (text || "").split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars) { if (line) lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// ── Sample story data ─────────────────────────────────────────────────────────
const CHILD_NAME = "Aria";
const STORY = {
  title:      "Aria and the Magic Forest",
  dedication: "For Aria, the bravest explorer in the cosmos",
  pages: [
    { pageNum: 1, text: "Deep in the enchanted forest, Aria discovered a door no one had ever seen before. It shimmered with golden light and hummed softly like a song." },
    { pageNum: 2, text: "She pushed it open. Inside was a world where flowers sang and rivers ran uphill. A tiny fox with silver ears bowed and said, 'We've been waiting for you.'" },
    { pageNum: 3, text: "But the forest was in trouble. The great oak tree at its centre had stopped glowing, and without its light, everything was growing cold and dark." },
    { pageNum: 4, text: "Aria remembered the sunstone in her pocket — a gift from her grandmother. 'This is why she gave it to me,' she whispered, holding it tight." },
    { pageNum: 5, text: "She pressed the sunstone to the oak's bark. For a moment nothing happened. Then — WHOOOOSH — golden light erupted through every branch and leaf and root." },
    { pageNum: 6, text: "The forest exploded with colour and warmth. The fox danced. The flowers cheered. Aria smiled and thought: home is anywhere you bring your light." },
  ],
};

async function buildCover() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const boldFont   = await doc.embedFont(BOLD_BYTES);
  const italFont   = await doc.embedFont(ITALIC_BYTES);
  const normFont   = await doc.embedFont(REGULAR_BYTES);

  const page = doc.addPage([CW, CH]);
  page.drawRectangle({ x: 0, y: 0, width: CW, height: CH, color: DARK });

  const frontX = PS + SPINE;

  // Front cover text
  page.drawText("My Tiny Tales", { x: frontX + M, y: CH * 0.38, size: 10, font: boldFont, color: GOLD });
  wrapText(STORY.title, 22).forEach((line, i) => {
    page.drawText(line, { x: frontX + M, y: CH * 0.30 - i * 24, size: 22, font: boldFont, color: WHITE });
  });
  page.drawText(STORY.dedication.substring(0, 50), { x: frontX + M, y: CH * 0.10, size: 10, font: italFont, color: GOLD });

  // Spine
  page.drawText(STORY.title.substring(0, 28), {
    x: PS + SPINE / 2 - 2, y: CH * 0.12,
    size: 5.5, font: boldFont, color: GOLD,
    rotate: { type: "degrees", angle: 90 },
  });

  // Back cover
  page.drawText("My Tiny Tales",                             { x: M, y: CH / 2 + 12, size: 12, font: boldFont, color: GOLD });
  page.drawText("A personalised storybook, made with love.", { x: M, y: CH / 2 - 16, size: 9,  font: italFont, color: WHITE });
  page.drawText("mytinytales.studio",                        { x: M, y: M - 10,       size: 8,  font: normFont, color: GOLD });

  return doc.save();
}

async function buildInterior() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const hFont = await doc.embedFont(BOLD_BYTES);
  const bFont = await doc.embedFont(REGULAR_BYTES);
  const iFont = await doc.embedFont(ITALIC_BYTES);

  const addBlank = () => {
    const p = doc.addPage([PS, PS]);
    p.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });
  };

  // Page 1: blank
  addBlank();

  // Page 2: title
  const p2 = doc.addPage([PS, PS]);
  p2.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
  p2.drawText("My Tiny Tales presents", { x: PS / 2 - 74, y: PS * 0.72, size: 10, font: iFont, color: GOLD });
  wrapText(STORY.title, 20).forEach((line, i) => {
    const w = hFont.widthOfTextAtSize(line, 28);
    p2.drawText(line, { x: (PS - w) / 2, y: PS * 0.56 - i * 32, size: 28, font: hFont, color: WHITE });
  });
  const subW = iFont.widthOfTextAtSize(`A story starring ${CHILD_NAME}`, 12);
  p2.drawText(`A story starring ${CHILD_NAME}`, { x: (PS - subW) / 2, y: PS * 0.35, size: 12, font: iFont, color: GOLD });

  // Page 3: dedication
  const p3 = doc.addPage([PS, PS]);
  p3.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
  p3.drawText("A story created for", { x: PS / 2 - 54, y: PS * 0.66, size: 10, font: iFont, color: GOLD });
  const nameW = hFont.widthOfTextAtSize(CHILD_NAME, 44);
  p3.drawText(CHILD_NAME, { x: (PS - nameW) / 2, y: PS * 0.50, size: 44, font: hFont, color: WHITE });
  p3.drawText('"May every adventure remind you', { x: PS / 2 - 102, y: PS * 0.36, size: 11, font: iFont, color: WHITE });
  p3.drawText('how loved, brave, and magical you are."', { x: PS / 2 - 112, y: PS * 0.27, size: 11, font: iFont, color: WHITE });

  // Pages 4–15: story spreads (no images in test — dark placeholder)
  const CHAPTER_NAMES = ["One", "Two", "Three", "Four", "Five", "Six"];
  for (let i = 0; i < 6; i++) {
    const pg = STORY.pages[i];

    // Left: text
    const textPg = doc.addPage([PS, PS]);
    textPg.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });
    textPg.drawText(`Chapter ${CHAPTER_NAMES[i]}`, { x: M + 26, y: PS - M - 7, size: 7.5, font: bFont, color: BROWN });
    const lines = wrapText(pg.text, 30);
    const lineH = 21;
    const startY = (PS + lines.length * lineH) / 2 - lineH;
    lines.forEach((line, li) => {
      textPg.drawText(line, { x: M, y: startY - li * lineH, size: 13.5, font: bFont, color: BROWN });
    });
    textPg.drawText(String((i + 1) * 2 - 1), { x: M, y: M - 14, size: 8, font: bFont, color: BROWN });

    // Right: image placeholder
    const imgPg = doc.addPage([PS, PS]);
    imgPg.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    imgPg.drawText("[illustration]", { x: PS / 2 - 40, y: PS / 2, size: 11, font: iFont, color: GOLD });
    imgPg.drawText(String((i + 1) * 2), { x: PS - M - 12, y: M - 14, size: 8, font: bFont, color: WHITE });
  }

  // Page 16: The End
  const p16 = doc.addPage([PS, PS]);
  p16.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
  const endW = hFont.widthOfTextAtSize("The End", 44);
  p16.drawText("The End", { x: (PS - endW) / 2, y: PS * 0.54, size: 44, font: hFont, color: GOLD });
  const closeW = iFont.widthOfTextAtSize(`Created with love for ${CHILD_NAME}`, 11);
  p16.drawText(`Created with love for ${CHILD_NAME}`, { x: (PS - closeW) / 2, y: PS * 0.38, size: 11, font: iFont, color: WHITE });

  // Pages 17–20: blanks
  addBlank(); addBlank(); addBlank();

  return doc.save();
}

// ── Run ───────────────────────────────────────────────────────────────────────
console.log("Building cover PDF...");
const coverBytes = await buildCover();
fs.writeFileSync(path.join(OUT, "test-cover.pdf"), coverBytes);
console.log("✓ test-cover.pdf written");

console.log("Building interior PDF...");
const interiorBytes = await buildInterior();
fs.writeFileSync(path.join(OUT, "test-interior.pdf"), interiorBytes);
console.log("✓ test-interior.pdf written");

console.log("\nNext steps:");
console.log("  1. Open test-interior.pdf in Adobe Reader");
console.log("  2. File → Properties → Fonts tab");
console.log("  3. Every font must show 'Embedded Subset'");
console.log("  4. Select some text — if it's selectable, fonts are live (not rasterised)");
