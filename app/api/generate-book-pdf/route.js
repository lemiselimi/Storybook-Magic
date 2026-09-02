import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { fal } from "@fal-ai/client";
import { LATO_BOLD_TTF, LIBRE_REGULAR_TTF, LIBRE_ITALIC_TTF } from "./fonts.js";

export const maxDuration = 60;

// 8×8" trim + 3mm bleed each side = 206mm × 206mm
// 206mm × (72pt / 25.4mm) = 583.9pt → 584pt
const PS = 584; // interior page: square 584×584 pt

// Interior is padded to this many pages (even; pages print two-up on each
// sheet). Prodigi treats page 1 of the PDF as the cover, so the "inside" count
// it validates is our file count minus the cover page(s): a 20-page file shows
// as 19 inside pages, just under their 20 minimum. So generate 22 file pages to
// clear the minimum with margin while still fitting all 8 chapters. Env-overridable.
const toEven = (n) => (n % 2 === 0 ? n : n + 1);
const INTERIOR_PAGES = toEven(Number(process.env.PRINT_MIN_PAGES) || Number(process.env.GELATO_INTERIOR_PAGES) || 22);

// Perfect-bound cover wrap: back (584pt) + spine + front (584pt).
// Spine scales with interior thickness: ~0.097mm/page (170 GSM coated silk),
// converted to points (72pt / 25.4mm). ≈ 9pt at 32 interior pages. Adjust if
// Gelato's spine calculator gives a different value.
const SPINE = Math.round(INTERIOR_PAGES * 0.097 * 72 / 25.4);
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

// Fonts embedded as base64 at build time — no fs.readFileSync, no process.cwd(),
// no outputFileTracingIncludes required. Guaranteed present in any serverless runtime.
const BOLD_BYTES    = LATO_BOLD_TTF;
const REGULAR_BYTES = LIBRE_REGULAR_TTF;
const ITALIC_BYTES  = LIBRE_ITALIC_TTF;

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

// Fade an illustration into a dark bottom panel without a hard seam. pdf-lib
// has no native gradients, so approximate one with thin horizontal bands: a
// solid base where text sits (y 0 → solidTop), then opacity easing smoothly to
// zero from solidTop up to fadeTop — the scene dissolves into the panel like dusk.
function fadeIntoPanel(page, x, w, solidTop, fadeTop, color, maxOpacity = 0.9) {
  page.drawRectangle({ x, y: 0, width: w, height: solidTop, color, opacity: maxOpacity });
  // Exactly-tiled bands (no overlap) so seams don't double-darken into lines.
  const bands = 110;
  const bh = (fadeTop - solidTop) / bands;
  for (let i = 0; i < bands; i++) {
    const t = (i + 0.5) / bands;                  // 0 just above the solid base, 1 at fadeTop
    const opacity = maxOpacity * Math.pow(1 - t, 1.6);
    if (opacity < 0.003) continue;
    page.drawRectangle({ x, y: solidTop + i * bh, width: w, height: bh, color, opacity });
  }
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
    const cBoldFont = await coverDoc.embedFont(BOLD_BYTES,    { subset: true });
    const cItalFont = await coverDoc.embedFont(ITALIC_BYTES,  { subset: true });
    const cNormFont = await coverDoc.embedFont(REGULAR_BYTES, { subset: true });

    const coverPage = coverDoc.addPage([CW, CH]);

    // Full background
    coverPage.drawRectangle({ x: 0, y: 0, width: CW, height: CH, color: DARK });

    // Front cover illustration (right panel, after spine)
    const frontX = PS + SPINE;
    const coverImg = await embedImg(coverDoc, coverBytes);
    if (coverImg) {
      coverPage.drawImage(coverImg, { x: frontX, y: 0, width: PS, height: CH });
      // Smooth dusk-like fade into the title panel instead of a hard rectangle.
      fadeIntoPanel(coverPage, frontX, PS, CH * 0.42, CH * 0.64, DARK, 0.9);
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

    // ── INTERIOR PDF ──────────────────────────────────────────────────────────
    // front cover + title + dedication + 8×2 story spreads + The End + keepsake +
    // illustration gallery + back cover, padded to the product's page minimum.
    const doc   = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const hFont = await doc.embedFont(BOLD_BYTES,    { subset: true });
    const bFont = await doc.embedFont(REGULAR_BYTES, { subset: true });
    const iFont = await doc.embedFont(ITALIC_BYTES,  { subset: true });

    const addBlank = (bg = CREAM) => {
      const p = doc.addPage([PS, PS]);
      p.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: bg });
    };

    // Page 1: Front cover — full-bleed illustration + title, so the digital
    // download opens on the cover instead of a blank page.
    const coverImgInt = await embedImg(doc, coverBytes);
    const fc = doc.addPage([PS, PS]);
    if (coverImgInt) {
      fc.drawImage(coverImgInt, { x: 0, y: 0, width: PS, height: PS });
      // Smooth fade into the title panel instead of a hard-edged rectangle.
      fadeIntoPanel(fc, 0, PS, PS * 0.32, PS * 0.56, DARK, 0.88);
    } else {
      fc.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    }
    fc.drawText("My Tiny Tales", { x: M, y: PS * 0.30, size: 11, font: hFont, color: GOLD, opacity: 0.8 });
    wrapText(story?.title || "My Story", 22).forEach((line, i) =>
      fc.drawText(line, { x: M, y: PS * 0.22 - i * 26, size: 24, font: hFont, color: WHITE }));
    fc.drawText(toWinAnsi(story?.dedication || `A story starring ${capName}`).substring(0, 50),
      { x: M, y: PS * 0.08, size: 10, font: iFont, color: GOLD, opacity: 0.7 });

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

    // 8 story spreads — left page = text, right page = full-bleed illustration
    const pages = story?.pages || [];
    const CHAPTER_NAMES = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
    // Embed each scene image once — reused in the spreads and the back gallery.
    const sceneImgs = await Promise.all((pageBytes || []).map(b => embedImg(doc, b)));
    for (let i = 0; i < 8; i++) {
      const storyPage = pages[i];
      const sceneImg  = sceneImgs[i];

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

    // Pad only if a short book falls under the product minimum — reuse the scene
    // art (zero extra AI cost) so any filler is pictures, not blanks. A normal
    // 8-chapter book already lands on the target, so this adds nothing. The final
    // page is reserved for the back cover; keep the count even.
    const gallery = sceneImgs.filter(Boolean);
    const padTo = toEven(Math.max(Number(body.padTo) || INTERIOR_PAGES, doc.getPageCount() + 1));
    let gi = 0;
    while (doc.getPageCount() < padTo - 1) {
      const g = doc.addPage([PS, PS]);
      const img = gallery.length ? gallery[gi % gallery.length] : null;
      if (img) g.drawImage(img, { x: 0, y: 0, width: PS, height: PS });
      else     g.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });
      gi++;
    }

    // Back cover — final page.
    const bc = doc.addPage([PS, PS]);
    bc.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
    bc.drawText("My Tiny Tales", { x: PS / 2 - 42, y: PS * 0.56, size: 14, font: hFont, color: GOLD, opacity: 0.75 });
    bc.drawRectangle({ x: PS / 2 - 30, y: PS * 0.52, width: 60, height: 1.5, color: GOLD, opacity: 0.4 });
    bc.drawText("A personalised storybook, made with love.", { x: PS / 2 - 120, y: PS * 0.45, size: 10, font: iFont, color: WHITE, opacity: 0.5 });
    bc.drawText("mytinytales.studio", { x: PS / 2 - 44, y: PS * 0.12, size: 9, font: bFont, color: GOLD, opacity: 0.4 });

    const interiorPageCount = doc.getPageCount();

    const interiorPdfBytes = await doc.save();
    console.log(`PDF: interior built (${interiorPageCount} pages), uploading...`);

    const [coverPdfUrl, interiorPdfUrl] = await Promise.all([
      fal.storage.upload(new File([coverPdfBytes],    "cover.pdf",    { type: "application/pdf" })),
      fal.storage.upload(new File([interiorPdfBytes], "interior.pdf", { type: "application/pdf" })),
    ]);

    console.log("PDF: done. cover:", coverPdfUrl, "interior:", interiorPdfUrl);
    return Response.json({ coverPdfUrl, interiorPdfUrl, interiorPageCount });

  } catch (err) {
    console.error("generate-book-pdf error:", err.message, err.stack);
    return Response.json({ error: err.message || "PDF generation failed" }, { status: 500 });
  }
}
