import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fal } from "@fal-ai/client";

export const maxDuration = 60;

// Page size: 11" × 8.5" landscape at 72pt/inch
const PW = 792; // 11 × 72
const PH = 612; // 8.5 × 72

const DARK = rgb(0.027, 0.016, 0.075);   // #07041A
const GOLD = rgb(1, 0.843, 0.082);        // #ffd700
const WHITE = rgb(1, 1, 1);

async function fetchBytes(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function embedImg(doc, url) {
  if (!url || url === "__failed__") return null;
  try {
    const bytes = await fetchBytes(url);
    // Try JPEG first, fall back to PNG
    return await doc.embedJpg(bytes).catch(() => doc.embedPng(bytes));
  } catch {
    return null;
  }
}

// Wrap text to fit within maxChars per line
function wrapText(text, maxChars = 80) {
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

function drawDarkPage(page) {
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: DARK });
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });

  const { coverFalUrl, pageFalUrls, story, childName, theme } = await request.json();

  const capName = childName
    ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
    : "You";

  // ── Cover PDF ────────────────────────────────────────────────────────────────
  const coverDoc = await PDFDocument.create();
  const boldFont = await coverDoc.embedFont(StandardFonts.HelveticaBold);
  const normFont = await coverDoc.embedFont(StandardFonts.TimesRomanItalic);

  const coverPage = coverDoc.addPage([PW, PH]);
  const coverImg = await embedImg(coverDoc, coverFalUrl);
  if (coverImg) {
    coverPage.drawImage(coverImg, { x: 0, y: 0, width: PW, height: PH });
  } else {
    drawDarkPage(coverPage);
  }
  // Gradient bar at bottom
  coverPage.drawRectangle({ x: 0, y: 0, width: PW, height: PH * 0.32, color: DARK, opacity: 0.94 });
  // Branding
  coverPage.drawText("My Tiny Tales", { x: 30, y: PH * 0.28, size: 11, font: boldFont, color: GOLD });
  // Title
  const titleLines = wrapText(story.title || "My Story", 36);
  titleLines.forEach((line, i) => {
    coverPage.drawText(line, { x: 30, y: PH * 0.21 - i * 28, size: 26, font: boldFont, color: WHITE });
  });
  // Subtitle / dedication
  const subText = story.dedication || `A story starring ${capName}`;
  coverPage.drawText(subText.substring(0, 70), { x: 30, y: PH * 0.07, size: 12, font: normFont, color: rgb(1, 0.843, 0.082, 0.75) });

  const coverBytes = await coverDoc.save();

  // ── Interior PDF (12 pages = 3 saddle-stitch sheets) ─────────────────────────
  const doc = await PDFDocument.create();
  const hFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const bFont = await doc.embedFont(StandardFonts.TimesRoman);
  const iFont = await doc.embedFont(StandardFonts.TimesRomanItalic);

  // Page 1: Blank (inside front cover)
  const p1 = doc.addPage([PW, PH]);
  drawDarkPage(p1);

  // Page 2: Title page
  const p2 = doc.addPage([PW, PH]);
  drawDarkPage(p2);
  p2.drawText("My Tiny Tales presents", { x: PW / 2 - 90, y: PH * 0.72, size: 12, font: iFont, color: rgb(1, 0.843, 0.082, 0.55) });
  const titleLines2 = wrapText(story.title || "My Story", 30);
  titleLines2.forEach((line, i) => {
    const textW = hFont.widthOfTextAtSize(line, 34);
    p2.drawText(line, { x: (PW - textW) / 2, y: PH * 0.58 - i * 38, size: 34, font: hFont, color: WHITE });
  });
  p2.drawRectangle({ x: PW / 2 - 40, y: PH * 0.43, width: 80, height: 1.5, color: GOLD, opacity: 0.6 });
  p2.drawText(`A story starring ${capName}`, { x: PW / 2 - 80, y: PH * 0.37, size: 13, font: iFont, color: rgb(1, 0.843, 0.082, 0.7) });

  // Page 3: Dedication
  const p3 = doc.addPage([PW, PH]);
  drawDarkPage(p3);
  p3.drawText("A story created for", { x: PW / 2 - 66, y: PH * 0.64, size: 11, font: iFont, color: rgb(1, 0.843, 0.082, 0.5) });
  const nameW = hFont.widthOfTextAtSize(capName, 52);
  p3.drawText(capName, { x: (PW - nameW) / 2, y: PH * 0.47, size: 52, font: hFont, color: WHITE });
  p3.drawRectangle({ x: PW / 2 - 30, y: PH * 0.42, width: 60, height: 2, color: GOLD, opacity: 0.45 });
  p3.drawText("\u201cMay every adventure remind you how loved, brave,", { x: PW / 2 - 170, y: PH * 0.33, size: 13, font: iFont, color: rgb(1, 1, 1, 0.65) });
  p3.drawText("and magical you are.\u201d", { x: PW / 2 - 70, y: PH * 0.25, size: 13, font: iFont, color: rgb(1, 1, 1, 0.65) });
  p3.drawText("My Tiny Tales", { x: PW / 2 - 44, y: PH * 0.12, size: 10, font: bFont, color: rgb(1, 0.843, 0.082, 0.3) });

  // Page 4: Blank before story
  const p4 = doc.addPage([PW, PH]);
  drawDarkPage(p4);

  // Pages 5–10: Story spreads (6 pages)
  const pages = story.pages || [];
  for (let i = 0; i < 6; i++) {
    const pg = doc.addPage([PW, PH]);
    const storyPage = pages[i];
    const imgUrl = pageFalUrls?.[i];

    const sceneImg = await embedImg(doc, imgUrl);
    const illustH = PH * 0.72;
    const textH = PH * 0.28;

    if (sceneImg) {
      pg.drawImage(sceneImg, { x: 0, y: textH, width: PW, height: illustH });
    } else {
      pg.drawRectangle({ x: 0, y: textH, width: PW, height: illustH, color: rgb(0.07, 0.05, 0.18) });
    }

    // Dark text area
    pg.drawRectangle({ x: 0, y: 0, width: PW, height: textH, color: DARK });
    pg.drawRectangle({ x: 0, y: textH, width: PW, height: 2, color: GOLD, opacity: 0.25 });

    if (storyPage?.text) {
      const lines = wrapText(storyPage.text, 90);
      lines.slice(0, 3).forEach((line, li) => {
        pg.drawText(line, { x: 28, y: PH * 0.235 - li * 17, size: 12, font: bFont, color: rgb(1, 1, 1, 0.92) });
      });
    }

    // Chapter label
    pg.drawText(`Chapter ${i + 1}`, { x: PW / 2 - 28, y: PH * 0.95, size: 8, font: bFont, color: GOLD, opacity: 0.5 });

    // Page number
    const pgNum = String(i + 1);
    const pgW = bFont.widthOfTextAtSize(pgNum, 10);
    pg.drawText(pgNum, { x: (PW - pgW) / 2, y: 12, size: 10, font: bFont, color: rgb(1, 0.843, 0.082, 0.45) });
  }

  // Page 11: Closing / The End
  const p11 = doc.addPage([PW, PH]);
  const lastImg = await embedImg(doc, pageFalUrls?.[5]);
  if (lastImg) {
    p11.drawImage(lastImg, { x: 0, y: 0, width: PW, height: PH });
    p11.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: DARK, opacity: 0.72 });
  } else {
    drawDarkPage(p11);
  }
  p11.drawText("\u2756   \u2756   \u2756", { x: PW / 2 - 28, y: PH * 0.72, size: 12, font: bFont, color: rgb(1, 0.843, 0.082, 0.4) });
  const endW = hFont.widthOfTextAtSize("The End", 52);
  p11.drawText("The End", { x: (PW - endW) / 2, y: PH * 0.56, size: 52, font: hFont, color: GOLD });
  p11.drawRectangle({ x: PW / 2 - 32, y: PH * 0.5, width: 64, height: 1, color: GOLD, opacity: 0.4 });
  const closingText = `Created with love for ${capName}`;
  const closeW = iFont.widthOfTextAtSize(closingText, 13);
  p11.drawText(closingText, { x: (PW - closeW) / 2, y: PH * 0.38, size: 13, font: iFont, color: rgb(1, 1, 1, 0.6) });
  p11.drawText("My Tiny Tales", { x: PW / 2 - 40, y: PH * 0.15, size: 10, font: bFont, color: rgb(1, 0.843, 0.082, 0.28) });

  // Page 12: Blank (inside back cover)
  const p12 = doc.addPage([PW, PH]);
  drawDarkPage(p12);

  const interiorBytes = await doc.save();

  // ── Upload both PDFs to fal.ai storage for durable URLs ───────────────────────
  const [coverPdfUrl, interiorPdfUrl] = await Promise.all([
    fal.storage.upload(new File([coverBytes], "cover.pdf", { type: "application/pdf" })),
    fal.storage.upload(new File([interiorBytes], "interior.pdf", { type: "application/pdf" })),
  ]);

  return Response.json({ coverPdfUrl, interiorPdfUrl });
}
