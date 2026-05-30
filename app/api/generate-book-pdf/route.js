import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

// 8×8" trim + 3mm bleed each side = 206mm × 206mm
// 206mm × (72pt / 25.4mm) = 583.9pt → 584pt
const PS = 584; // interior page: square 584×584 pt

// Perfect-bound cover wrap: back (584pt) + spine + front (584pt)
// Spine = 20 interior pages × 170 GSM coated silk (~0.097mm/page) + 2 cover sheets
// ≈ 2.4mm → 7pt.  Adjust SPINE if Gelato's spine calculator gives a different value.
const SPINE = 7;
const CW = PS * 2 + SPINE; // 1175pt wide
const CH = PS;              // 584pt tall

// Safety margin inside bleed (0.375" = 27pt from trim edge ≈ 36pt from PDF edge)
const M = 36;

const DARK  = rgb(0.06,  0.04,  0.14);
const CREAM = rgb(0.992, 0.973, 0.937);
const BROWN = rgb(0.165, 0.082, 0.020);
const GOLD  = rgb(0.910, 0.753, 0.478);
const WHITE = rgb(1, 1, 1);

async function fetchBytes(url) {
  if (!url || url === "__failed__") return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) { console.warn(`fetchBytes: ${url} → ${res.status}`); return null; }
    return new Uint8Array(await res.arrayBuffer());
  } catch (err) {
    console.warn(`fetchBytes failed: ${err.message}`); return null;
  }
}

async function embedImg(doc, bytes) {
  if (!bytes) return null;
  try { return await doc.embedJpg(bytes).catch(() => doc.embedPng(bytes)); }
  catch { return null; }
}

const FONT_DIR = path.join(process.cwd(), "node_modules");
function loadFont(pkg, file) {
  return fs.readFileSync(path.join(FONT_DIR, pkg, "files", file));
}

const BOLD_BYTES    = loadFont("@fontsource/lato",               "lato-latin-700-normal.woff2");
const REGULAR_BYTES = loadFont("@fontsource/libre-baskerville",  "libre-baskerville-latin-400-normal.woff2");
const ITALIC_BYTES  = loadFont("@fontsource/libre-baskerville",  "libre-baskerville-latin-400-italic.woff2");

function sanitize(str) {
  return (str || "")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu,   "")
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .trim();
}

const toWinAnsi = sanitize;

function wrapText(text, maxChars = 60) {
  const words = sanitize(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const { coverFalUrl, pageFalUrls, story, childName } = body;

  try {
    const capName = toWinAnsi(childName
      ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
      : "You");

    console.log("PDF: fetching images...");
    const allBytes = await Promise.all([coverFalUrl, ...(pageFalUrls || [])].map(fetchBytes));
    const [coverBytes, ...pageBytes] = allBytes;
    console.log(`PDF: fetched ${allBytes.filter(Boolean).length}/${allBytes.length} images`);

    // ── COVER PDF — perfect-bound wrap (back | spine | front) ────────────────
    const coverDoc  = await PDFDocument.create();
    coverDoc.registerFontkit(fontkit);
    const cBoldFont = await coverDoc.embedFont(BOLD_BYTES);
    const cItalFont = await coverDoc.embedFont(ITALIC_BYTES);
    const cNormFont = await coverDoc.embedFont(REGULAR_BYTES);

    const coverPage = coverDoc.addPage([CW, CH]);

    // Full background
    coverPage.drawRectangle({ x: 0, y: 0, width: CW, height: CH, color: DARK });

    // Front cover illustration (right panel, after spine)
    const frontX = PS + SPINE;
    const coverImg = await embedImg(coverDoc, coverBytes);
    if (coverImg) {
      coverPage.drawImage(coverImg, { x: frontX, y: 0, width: PS, height: CH });
      coverPage.drawRectangle({ x: frontX, y: 0, width: PS, height: CH * 0.45, color: DARK, opacity: 0.88 });
    }

    // Front cover text
    coverPage.drawText("My Tiny Tales", { x: frontX + M, y: CH * 0.38, size: 10, font: cBoldFont, color: GOLD, opacity: 0.8 });
    const titleLines = wrapText(toWinAnsi(story?.title || "My Story"), 22);
    titleLines.forEach((line, i) => {
      coverPage.drawText(line, { x: frontX + M, y: CH * 0.30 - i * 24, size: 22, font: cBoldFont, color: WHITE });
    });
    const dedication = toWinAnsi(story?.dedication || `A story starring ${capName}`).substring(0, 50);
    coverPage.drawText(dedication, { x: frontX + M, y: CH * 0.10, size: 10, font: cItalFont, color: GOLD, opacity: 0.7 });

    // Spine — title rotated (drawn horizontally then rotated via translate)
    if (SPINE >= 6) {
      const spineTitle = sanitize(story?.title || "My Tiny Tales").substring(0, 28);
      coverPage.drawText(spineTitle, {
        x: PS + SPINE / 2 - 2, y: CH * 0.12,
        size: 5.5, font: cBoldFont, color: GOLD, opacity: 0.5,
        rotate: { type: "degrees", angle: 90 },
      });
    }

    // Back cover
    coverPage.drawRectangle({ x: M, y: CH / 2, width: 36, height: 1.5, color: GOLD, opacity: 0.4 });
    coverPage.drawText("My Tiny Tales", { x: M, y: CH / 2 + 12, size: 12, font: cBoldFont, color: GOLD, opacity: 0.6 });
    coverPage.drawText("A personalised storybook, made with love.", { x: M, y: CH / 2 - 16, size: 9, font: cItalFont, color: WHITE, opacity: 0.4 });
    coverPage.drawText("mytinytales.studio", { x: M, y: M - 10, size: 8, font: cNormFont, color: GOLD, opacity: 0.3 });

    const coverPdfBytes = await coverDoc.save();
    console.log("PDF: cover built");

    // ── INTERIOR PDF — 20 pages ───────────────────────────────────────────────
    // 1 blank + title + dedication + 6×2 story spreads + The End + 3 blanks = 20
    const doc   = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const hFont = await doc.embedFont(BOLD_BYTES);
    const bFont = await doc.embedFont(REGULAR_BYTES);
    const iFont = await doc.embedFont(ITALIC_BYTES);

    const addBlank = (bg = CREAM) => {
      const p = doc.addPage([PS, PS]);
      p.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: bg });
    };

    // Page 1: Blank (inside front cover)
    addBlank(CREAM);

    // Page 2: Title page
    const p2 = doc.addPage([PS, PS]);
    p2.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    p2.drawText("My Tiny Tales presents", { x: PS / 2 - 74, y: PS * 0.72, size: 10, font: iFont, color: GOLD, opacity: 0.55 });
    const tLines = wrapText(story?.title || "My Story", 20);
    tLines.forEach((line, i) => {
      const w = hFont.widthOfTextAtSize(line, 28);
      p2.drawText(line, { x: (PS - w) / 2, y: PS * 0.56 - i * 32, size: 28, font: hFont, color: WHITE });
    });
    p2.drawRectangle({ x: PS / 2 - 34, y: PS * 0.42, width: 68, height: 1.5, color: GOLD, opacity: 0.5 });
    const subText2 = sanitize(`A story starring ${capName}`);
    const subW = iFont.widthOfTextAtSize(subText2, 12);
    p2.drawText(subText2, { x: (PS - subW) / 2, y: PS * 0.35, size: 12, font: iFont, color: GOLD, opacity: 0.7 });

    // Page 3: Dedication
    const p3 = doc.addPage([PS, PS]);
    p3.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    p3.drawText("A story created for", { x: PS / 2 - 54, y: PS * 0.66, size: 10, font: iFont, color: GOLD, opacity: 0.5 });
    const nameW = hFont.widthOfTextAtSize(capName, 44);
    p3.drawText(capName, { x: (PS - nameW) / 2, y: PS * 0.50, size: 44, font: hFont, color: WHITE });
    p3.drawRectangle({ x: PS / 2 - 26, y: PS * 0.45, width: 52, height: 2, color: GOLD, opacity: 0.4 });
    p3.drawText("\"May every adventure remind you", { x: PS / 2 - 102, y: PS * 0.36, size: 11, font: iFont, color: WHITE, opacity: 0.6 });
    p3.drawText("how loved, brave, and magical you are.\"", { x: PS / 2 - 112, y: PS * 0.27, size: 11, font: iFont, color: WHITE, opacity: 0.6 });
    p3.drawText("My Tiny Tales", { x: PS / 2 - 36, y: PS * 0.13, size: 8, font: bFont, color: GOLD, opacity: 0.3 });

    // Pages 4–15: 6 story spreads — left page = text, right page = full-bleed illustration
    const pages = story?.pages || [];
    const CHAPTER_NAMES = ["One", "Two", "Three", "Four", "Five", "Six"];
    for (let i = 0; i < 6; i++) {
      const storyPage = pages[i];
      const sceneImg  = await embedImg(doc, pageBytes[i]);

      // LEFT page — cream, text only
      const textPg = doc.addPage([PS, PS]);
      textPg.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });

      textPg.drawRectangle({ x: M, y: PS - M - 1, width: 20, height: 1, color: BROWN, opacity: 0.35 });
      const chLabel = sanitize(`Chapter ${CHAPTER_NAMES[i]}`);
      textPg.drawText(chLabel, { x: M + 26, y: PS - M - 7, size: 7.5, font: bFont, color: BROWN, opacity: 0.5 });

      if (storyPage?.text) {
        const lines = wrapText(storyPage.text, 30);
        const lineH  = 21;
        const blockH = lines.length * lineH;
        const startY = (PS + blockH) / 2 - lineH;
        lines.forEach((line, li) => {
          textPg.drawText(line, { x: M, y: startY - li * lineH, size: 13.5, font: bFont, color: BROWN });
        });
      }

      const pgNum = String((i + 1) * 2 - 1);
      textPg.drawText(pgNum, { x: M, y: M - 14, size: 8, font: bFont, color: BROWN, opacity: 0.35 });

      // RIGHT page — full-bleed illustration
      const imgPg = doc.addPage([PS, PS]);
      if (sceneImg) {
        imgPg.drawImage(sceneImg, { x: 0, y: 0, width: PS, height: PS });
      } else {
        imgPg.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
      }
      const pgNum2 = String((i + 1) * 2);
      const pgW2   = bFont.widthOfTextAtSize(pgNum2, 8);
      imgPg.drawText(pgNum2, { x: PS - M - pgW2, y: M - 14, size: 8, font: bFont, color: WHITE, opacity: 0.4 });
    }
    console.log("PDF: story pages built");

    // Page 16: The End
    const p16 = doc.addPage([PS, PS]);
    p16.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    p16.drawText("*   *   *", { x: PS / 2 - 22, y: PS * 0.70, size: 10, font: bFont, color: GOLD, opacity: 0.45 });
    const endW = hFont.widthOfTextAtSize("The End", 44);
    p16.drawText("The End", { x: (PS - endW) / 2, y: PS * 0.54, size: 44, font: hFont, color: GOLD });
    p16.drawRectangle({ x: PS / 2 - 26, y: PS * 0.49, width: 52, height: 1, color: GOLD, opacity: 0.35 });
    const closingText = sanitize(`Created with love for ${capName}`);
    const closeW = iFont.widthOfTextAtSize(closingText, 11);
    p16.drawText(closingText, { x: (PS - closeW) / 2, y: PS * 0.38, size: 11, font: iFont, color: WHITE, opacity: 0.55 });
    p16.drawText("My Tiny Tales", { x: PS / 2 - 34, y: PS * 0.16, size: 8, font: bFont, color: GOLD, opacity: 0.28 });

    // Pages 17–20: blank back matter (total = 20 pages for perfect-bound minimum)
    addBlank(CREAM);
    addBlank(CREAM);
    addBlank(CREAM);

    const interiorPdfBytes = await doc.save();
    console.log("PDF: interior built (20 pages), uploading...");

    const [coverPdfUrl, interiorPdfUrl] = await Promise.all([
      fal.storage.upload(new File([coverPdfBytes],    "cover.pdf",    { type: "application/pdf" })),
      fal.storage.upload(new File([interiorPdfBytes], "interior.pdf", { type: "application/pdf" })),
    ]);

    console.log("PDF: done. cover:", coverPdfUrl, "interior:", interiorPdfUrl);
    return Response.json({ coverPdfUrl, interiorPdfUrl });

  } catch (err) {
    console.error("generate-book-pdf error:", err.message, err.stack);
    return Response.json({ error: err.message || "PDF generation failed" }, { status: 500 });
  }
}
