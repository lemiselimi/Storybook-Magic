import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

// 8.5×8.5" trim + 0.125" bleed on each side = 8.75×8.75" PDF page
// At 72pt/inch: 8.75 × 72 = 630pt
const PS = 630; // interior page: square 630×630 pt

// Cover wrap: front (8.75") + back (8.75") = 17.25" wide (spine = 0 for saddle stitch)
// 17.25 × 72 = 1242 pt wide, 630 pt tall
const CW = 1242;
const CH = 630;

// Safety margin inside bleed: 0.5" = 36pt from trim edge = 45pt from PDF edge
const M = 45;

const DARK  = rgb(0.06,  0.04,  0.14);
const CREAM = rgb(0.992, 0.973, 0.937); // #fdfcf7
const BROWN = rgb(0.165, 0.082, 0.020); // #2a1505
const GOLD  = rgb(0.910, 0.753, 0.478); // #E8C07A
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

// Load embedded font bytes from node_modules (deployed with the function)
const FONT_DIR = path.join(process.cwd(), "node_modules");
function loadFont(pkg, file) {
  return fs.readFileSync(path.join(FONT_DIR, pkg, "files", file));
}

const BOLD_BYTES    = loadFont("@fontsource/lato",               "lato-latin-700-normal.woff2");
const REGULAR_BYTES = loadFont("@fontsource/libre-baskerville",  "libre-baskerville-latin-400-normal.woff2");
const ITALIC_BYTES  = loadFont("@fontsource/libre-baskerville",  "libre-baskerville-latin-400-italic.woff2");

// With embedded fonts we can support full Unicode — no stripping needed,
// but keep the helper for any legacy callers
function toWinAnsi(str) {
  return (str || "");
}

function wrapText(text, maxChars = 60) {
  text = toWinAnsi(text);
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars) { lines.push(line); line = word; }
    else line = test;
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

    // Fetch all images in parallel
    console.log("PDF: fetching images...");
    const allBytes = await Promise.all([coverFalUrl, ...(pageFalUrls || [])].map(fetchBytes));
    const [coverBytes, ...pageBytes] = allBytes;
    console.log(`PDF: fetched ${allBytes.filter(Boolean).length}/${allBytes.length} images`);

    // ── COVER PDF — full wrap 17.25×8.75" ─────────────────────────────────────
    // Layout: back cover (left half, x 0–621) | front cover (right half, x 621–1242)
    const coverDoc  = await PDFDocument.create();
    coverDoc.registerFontkit(fontkit);
    const cBoldFont = await coverDoc.embedFont(BOLD_BYTES);
    const cItalFont = await coverDoc.embedFont(ITALIC_BYTES);
    const cNormFont = await coverDoc.embedFont(REGULAR_BYTES);

    const coverPage = coverDoc.addPage([CW, CH]);

    // Background: dark across full wrap
    coverPage.drawRectangle({ x: 0, y: 0, width: CW, height: CH, color: DARK });

    // Front cover illustration (right half)
    const coverImg = await embedImg(coverDoc, coverBytes);
    if (coverImg) {
      coverPage.drawImage(coverImg, { x: CW / 2, y: 0, width: CW / 2, height: CH });
      // Gradient over front cover image for text legibility
      coverPage.drawRectangle({ x: CW / 2, y: 0, width: CW / 2, height: CH * 0.45, color: DARK, opacity: 0.88 });
    }

    // Front cover text (bottom of right half)
    coverPage.drawText("My Tiny Tales", { x: CW / 2 + M, y: CH * 0.38, size: 10, font: cBoldFont, color: GOLD, opacity: 0.8 });
    const titleLines = wrapText(toWinAnsi(story?.title || "My Story"), 22);
    titleLines.forEach((line, i) => {
      coverPage.drawText(line, { x: CW / 2 + M, y: CH * 0.30 - i * 26, size: 24, font: cBoldFont, color: WHITE });
    });
    const dedication = toWinAnsi(story?.dedication || `A story starring ${capName}`).substring(0, 50);
    coverPage.drawText(dedication, { x: CW / 2 + M, y: CH * 0.10, size: 11, font: cItalFont, color: GOLD, opacity: 0.7 });

    // Back cover (left half) — simple branded design
    coverPage.drawRectangle({ x: 0, y: 0, width: CW / 2, height: CH, color: DARK });
    // Subtle decorative line
    coverPage.drawRectangle({ x: M, y: CH / 2, width: 40, height: 1.5, color: GOLD, opacity: 0.4 });
    coverPage.drawText("My Tiny Tales", { x: M, y: CH / 2 + 14, size: 13, font: cBoldFont, color: GOLD, opacity: 0.6 });
    coverPage.drawText("A personalised storybook, made with love.", { x: M, y: CH / 2 - 18, size: 10, font: cItalFont, color: WHITE, opacity: 0.4 });
    coverPage.drawText("mytinytales.studio", { x: M, y: M - 10, size: 9, font: cNormFont, color: GOLD, opacity: 0.3 });

    const coverPdfBytes = await coverDoc.save();
    console.log("PDF: cover built");

    // ── INTERIOR PDF — 12 pages at 8.75×8.75" each ────────────────────────────
    const doc   = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const hFont = await doc.embedFont(BOLD_BYTES);
    const bFont = await doc.embedFont(REGULAR_BYTES);
    const iFont = await doc.embedFont(ITALIC_BYTES);

    // Page 1: Blank (inside front cover)
    const p1 = doc.addPage([PS, PS]);
    p1.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });

    // Page 2: Title page
    const p2 = doc.addPage([PS, PS]);
    p2.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    p2.drawText("My Tiny Tales presents", { x: PS / 2 - 80, y: PS * 0.72, size: 11, font: iFont, color: GOLD, opacity: 0.55 });
    const tLines = wrapText(toWinAnsi(story?.title || "My Story"), 20);
    tLines.forEach((line, i) => {
      const w = hFont.widthOfTextAtSize(line, 30);
      p2.drawText(line, { x: (PS - w) / 2, y: PS * 0.56 - i * 34, size: 30, font: hFont, color: WHITE });
    });
    p2.drawRectangle({ x: PS / 2 - 36, y: PS * 0.42, width: 72, height: 1.5, color: GOLD, opacity: 0.5 });
    const subText2 = toWinAnsi(`A story starring ${capName}`);
    const subW = iFont.widthOfTextAtSize(subText2, 13);
    p2.drawText(subText2, { x: (PS - subW) / 2, y: PS * 0.35, size: 13, font: iFont, color: GOLD, opacity: 0.7 });

    // Page 3: Dedication
    const p3 = doc.addPage([PS, PS]);
    p3.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    p3.drawText("A story created for", { x: PS / 2 - 58, y: PS * 0.66, size: 11, font: iFont, color: GOLD, opacity: 0.5 });
    const nameW = hFont.widthOfTextAtSize(capName, 48);
    p3.drawText(capName, { x: (PS - nameW) / 2, y: PS * 0.50, size: 48, font: hFont, color: WHITE });
    p3.drawRectangle({ x: PS / 2 - 28, y: PS * 0.45, width: 56, height: 2, color: GOLD, opacity: 0.4 });
    p3.drawText("\"May every adventure remind you", { x: PS / 2 - 110, y: PS * 0.36, size: 12, font: iFont, color: WHITE, opacity: 0.6 });
    p3.drawText("how loved, brave, and magical you are.\"", { x: PS / 2 - 120, y: PS * 0.27, size: 12, font: iFont, color: WHITE, opacity: 0.6 });
    p3.drawText("My Tiny Tales", { x: PS / 2 - 38, y: PS * 0.13, size: 9, font: bFont, color: GOLD, opacity: 0.3 });

    // Page 4: Blank before story
    const p4 = doc.addPage([PS, PS]);
    p4.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });

    // Pages 5–10: Story pages — full-bleed illustration, cream text band at bottom
    const pages = story?.pages || [];
    for (let i = 0; i < 6; i++) {
      const pg = doc.addPage([PS, PS]);
      const storyPage = pages[i];
      const sceneImg  = await embedImg(doc, pageBytes[i]);

      const textBandH = PS * 0.30; // 30% at bottom for text
      const imgH      = PS - textBandH;

      // Illustration (top portion)
      if (sceneImg) {
        pg.drawImage(sceneImg, { x: 0, y: textBandH, width: PS, height: imgH });
      } else {
        pg.drawRectangle({ x: 0, y: textBandH, width: PS, height: imgH, color: DARK });
      }

      // Cream text band
      pg.drawRectangle({ x: 0, y: 0, width: PS, height: textBandH, color: CREAM });
      // Thin gold rule separating image from text
      pg.drawRectangle({ x: 0, y: textBandH - 1, width: PS, height: 1, color: GOLD, opacity: 0.3 });

      // Story text
      if (storyPage?.text) {
        const lines = wrapText(storyPage.text, 52);
        lines.slice(0, 4).forEach((line, li) => {
          pg.drawText(line, { x: M, y: textBandH - M - li * 16, size: 11, font: bFont, color: BROWN });
        });
      }

      // Chapter label top-right of image
      const chLabel = `Chapter ${i + 1}`;
      const chW = bFont.widthOfTextAtSize(chLabel, 8);
      pg.drawText(chLabel, { x: PS - M - chW, y: PS - M + 6, size: 8, font: bFont, color: GOLD, opacity: 0.6 });

      // Page number at bottom centre
      const pgNum = String(i + 1);
      const pgW   = bFont.widthOfTextAtSize(pgNum, 9);
      pg.drawText(pgNum, { x: (PS - pgW) / 2, y: M - 18, size: 9, font: bFont, color: BROWN, opacity: 0.4 });
    }
    console.log("PDF: story pages built");

    // Page 11: The End
    const p11 = doc.addPage([PS, PS]);
    const lastImg = await embedImg(doc, pageBytes[5]);
    if (lastImg) {
      p11.drawImage(lastImg, { x: 0, y: 0, width: PS, height: PS });
      p11.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK, opacity: 0.70 });
    } else {
      p11.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    }
    p11.drawText("*   *   *", { x: PS / 2 - 24, y: PS * 0.70, size: 11, font: bFont, color: GOLD, opacity: 0.45 });
    const endW = hFont.widthOfTextAtSize("The End", 48);
    p11.drawText("The End", { x: (PS - endW) / 2, y: PS * 0.54, size: 48, font: hFont, color: GOLD });
    p11.drawRectangle({ x: PS / 2 - 28, y: PS * 0.49, width: 56, height: 1, color: GOLD, opacity: 0.35 });
    const closingText = toWinAnsi(`Created with love for ${capName}`);
    const closeW = iFont.widthOfTextAtSize(closingText, 12);
    p11.drawText(closingText, { x: (PS - closeW) / 2, y: PS * 0.38, size: 12, font: iFont, color: WHITE, opacity: 0.55 });
    p11.drawText("My Tiny Tales", { x: PS / 2 - 36, y: PS * 0.16, size: 9, font: bFont, color: GOLD, opacity: 0.28 });

    // Page 12: Blank (inside back cover)
    const p12 = doc.addPage([PS, PS]);
    p12.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });

    const interiorPdfBytes = await doc.save();
    console.log("PDF: interior built, uploading...");

    // Upload both PDFs to fal.ai storage
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
