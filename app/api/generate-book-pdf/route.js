import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { fal } from "@fal-ai/client";

export const maxDuration = 60;

const PW = 792; // 11" × 72pt
const PH = 612; // 8.5" × 72pt

const DARK = rgb(0.027, 0.016, 0.075);
const GOLD = rgb(0.910, 0.753, 0.478); // #E8C07A
const WHITE = rgb(1, 1, 1);

async function fetchBytes(url) {
  if (!url || url === "__failed__") return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) {
      console.warn(`fetchBytes: ${url} → ${res.status}`);
      return null;
    }
    return new Uint8Array(await res.arrayBuffer());
  } catch (err) {
    console.warn(`fetchBytes failed for ${url}: ${err.message}`);
    return null;
  }
}

async function embedImg(doc, bytes) {
  if (!bytes) return null;
  try {
    return await doc.embedJpg(bytes).catch(() => doc.embedPng(bytes));
  } catch {
    return null;
  }
}

// Strip characters outside WinAnsi (0x00–0xFF) — StandardFonts can't encode them
function toWinAnsi(str) {
  return (str || "").replace(/[^\x00-\xFF]/g, "");
}

function wrapText(text, maxChars = 80) {
  text = toWinAnsi(text);
  const words = (text || "").split(" ");
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

function drawDark(page) {
  page.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: DARK });
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { coverFalUrl, pageFalUrls, story, childName } = body;

  try {
    const capName = toWinAnsi(childName
      ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
      : "You");

    // ── Fetch all images in parallel ────────────────────────────────────────────
    console.log("PDF: fetching images...");
    const allUrls = [coverFalUrl, ...(pageFalUrls || [])];
    const allBytes = await Promise.all(allUrls.map(fetchBytes));
    const [coverBytes, ...pageBytes] = allBytes;
    console.log(`PDF: fetched ${allBytes.filter(Boolean).length}/${allUrls.length} images`);

    // ── Cover PDF ───────────────────────────────────────────────────────────────
    const coverDoc = await PDFDocument.create();
    const boldFont = await coverDoc.embedFont(StandardFonts.HelveticaBold);
    const normFont = await coverDoc.embedFont(StandardFonts.TimesRomanItalic);

    const coverPage = coverDoc.addPage([PW, PH]);
    const coverImg = await embedImg(coverDoc, coverBytes);
    if (coverImg) {
      coverPage.drawImage(coverImg, { x: 0, y: 0, width: PW, height: PH });
    } else {
      drawDark(coverPage);
    }
    coverPage.drawRectangle({ x: 0, y: 0, width: PW, height: PH * 0.32, color: DARK, opacity: 0.94 });
    coverPage.drawText("My Tiny Tales", { x: 30, y: PH * 0.28, size: 11, font: boldFont, color: GOLD });
    const titleLines = wrapText(toWinAnsi(story?.title || "My Story"), 36);
    titleLines.forEach((line, i) => {
      coverPage.drawText(line, { x: 30, y: PH * 0.21 - i * 28, size: 26, font: boldFont, color: WHITE });
    });
    const subText = toWinAnsi(story?.dedication || `A story starring ${capName}`).substring(0, 70);
    coverPage.drawText(subText, { x: 30, y: PH * 0.07, size: 12, font: normFont, color: GOLD, opacity: 0.75 });

    const coverPdfBytes = await coverDoc.save();
    console.log("PDF: cover built");

    // ── Interior PDF ────────────────────────────────────────────────────────────
    const doc = await PDFDocument.create();
    const hFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const bFont = await doc.embedFont(StandardFonts.TimesRoman);
    const iFont = await doc.embedFont(StandardFonts.TimesRomanItalic);

    // Page 1: Blank
    drawDark(doc.addPage([PW, PH]));

    // Page 2: Title
    const p2 = doc.addPage([PW, PH]);
    drawDark(p2);
    p2.drawText("My Tiny Tales presents", { x: PW / 2 - 90, y: PH * 0.72, size: 12, font: iFont, color: GOLD, opacity: 0.55 });
    const tLines = wrapText(toWinAnsi(story?.title || "My Story"), 30);
    tLines.forEach((line, i) => {
      const w = hFont.widthOfTextAtSize(line, 34);
      p2.drawText(line, { x: (PW - w) / 2, y: PH * 0.58 - i * 38, size: 34, font: hFont, color: WHITE });
    });
    p2.drawRectangle({ x: PW / 2 - 40, y: PH * 0.43, width: 80, height: 1.5, color: GOLD, opacity: 0.6 });
    p2.drawText(`A story starring ${capName}`, { x: PW / 2 - 80, y: PH * 0.37, size: 13, font: iFont, color: GOLD, opacity: 0.7 });

    // Page 3: Dedication
    const p3 = doc.addPage([PW, PH]);
    drawDark(p3);
    p3.drawText("A story created for", { x: PW / 2 - 66, y: PH * 0.64, size: 11, font: iFont, color: GOLD, opacity: 0.5 });
    const nameW = hFont.widthOfTextAtSize(capName, 52);
    p3.drawText(capName, { x: (PW - nameW) / 2, y: PH * 0.47, size: 52, font: hFont, color: WHITE });
    p3.drawRectangle({ x: PW / 2 - 30, y: PH * 0.42, width: 60, height: 2, color: GOLD, opacity: 0.45 });
    p3.drawText("\"May every adventure remind you how loved, brave,", { x: PW / 2 - 170, y: PH * 0.33, size: 13, font: iFont, color: WHITE, opacity: 0.65 });
    p3.drawText("and magical you are.\"", { x: PW / 2 - 70, y: PH * 0.25, size: 13, font: iFont, color: WHITE, opacity: 0.65 });
    p3.drawText("My Tiny Tales", { x: PW / 2 - 44, y: PH * 0.12, size: 10, font: bFont, color: GOLD, opacity: 0.3 });

    // Page 4: Blank
    drawDark(doc.addPage([PW, PH]));

    // Pages 5–10: Story spreads
    const pages = story?.pages || [];
    for (let i = 0; i < 6; i++) {
      const pg = doc.addPage([PW, PH]);
      const storyPage = pages[i];
      const sceneImg = await embedImg(doc, pageBytes[i]);

      const illustH = PH * 0.72;
      const textH   = PH * 0.28;

      if (sceneImg) {
        pg.drawImage(sceneImg, { x: 0, y: textH, width: PW, height: illustH });
      } else {
        pg.drawRectangle({ x: 0, y: textH, width: PW, height: illustH, color: rgb(0.07, 0.05, 0.18) });
      }

      pg.drawRectangle({ x: 0, y: 0, width: PW, height: textH, color: DARK });
      pg.drawRectangle({ x: 0, y: textH, width: PW, height: 2, color: GOLD, opacity: 0.25 });

      if (storyPage?.text) {
        wrapText(storyPage.text, 90).slice(0, 3).forEach((line, li) => {
          pg.drawText(line, { x: 28, y: PH * 0.235 - li * 17, size: 12, font: bFont, color: WHITE, opacity: 0.92 });
        });
      }

      pg.drawText(`Chapter ${i + 1}`, { x: PW / 2 - 28, y: PH * 0.95, size: 8, font: bFont, color: GOLD, opacity: 0.5 });
      const pgNum = String(i + 1);
      const pgW = bFont.widthOfTextAtSize(pgNum, 10);
      pg.drawText(pgNum, { x: (PW - pgW) / 2, y: 12, size: 10, font: bFont, color: GOLD, opacity: 0.45 });
    }
    console.log("PDF: story pages built");

    // Page 11: The End
    const p11 = doc.addPage([PW, PH]);
    const lastImg = await embedImg(doc, pageBytes[5]);
    if (lastImg) {
      p11.drawImage(lastImg, { x: 0, y: 0, width: PW, height: PH });
      p11.drawRectangle({ x: 0, y: 0, width: PW, height: PH, color: DARK, opacity: 0.72 });
    } else {
      drawDark(p11);
    }
    p11.drawText("*   *   *", { x: PW / 2 - 28, y: PH * 0.72, size: 12, font: bFont, color: GOLD, opacity: 0.4 });
    const endW = hFont.widthOfTextAtSize("The End", 52);
    p11.drawText("The End", { x: (PW - endW) / 2, y: PH * 0.56, size: 52, font: hFont, color: GOLD });
    p11.drawRectangle({ x: PW / 2 - 32, y: PH * 0.5, width: 64, height: 1, color: GOLD, opacity: 0.4 });
    const closingText = `Created with love for ${capName}`;
    const closeW = iFont.widthOfTextAtSize(closingText, 13);
    p11.drawText(closingText, { x: (PW - closeW) / 2, y: PH * 0.38, size: 13, font: iFont, color: WHITE, opacity: 0.6 });
    p11.drawText("My Tiny Tales", { x: PW / 2 - 40, y: PH * 0.15, size: 10, font: bFont, color: GOLD, opacity: 0.28 });

    // Page 12: Blank
    drawDark(doc.addPage([PW, PH]));

    const interiorPdfBytes = await doc.save();
    console.log("PDF: interior built, uploading...");

    // ── Upload to fal.ai storage ─────────────────────────────────────────────────
    const [coverPdfUrl, interiorPdfUrl] = await Promise.all([
      fal.storage.upload(new File([coverPdfBytes],    "cover.pdf",    { type: "application/pdf" })),
      fal.storage.upload(new File([interiorPdfBytes], "interior.pdf", { type: "application/pdf" })),
    ]);

    console.log("PDF: upload done. cover:", coverPdfUrl, "interior:", interiorPdfUrl);
    return Response.json({ coverPdfUrl, interiorPdfUrl });

  } catch (err) {
    console.error("generate-book-pdf error:", err.message, err.stack);
    return Response.json({ error: err.message || "PDF generation failed" }, { status: 500 });
  }
}
