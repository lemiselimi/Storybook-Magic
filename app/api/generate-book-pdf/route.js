import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { fal } from "@fal-ai/client";
import { LATO_BOLD_TTF, LIBRE_REGULAR_TTF, LIBRE_ITALIC_TTF } from "./fonts.js";
import { isAllowedFalAsset, isInternalRequest } from "@/lib/security";
import {
  DEFAULT_INTERIOR_PAGE_COUNT,
  INNER_GUTTER_ALLOWANCE_PT,
  PAGE_SIZE_PT,
  SAFE_MARGIN_PT,
  TEXT_INNER_MARGIN_PT,
  controlledCoverSubtitle,
  displayName,
  fitTextToBox,
  preflightBook,
  validatePdfPlan,
} from "@/lib/book-layout";

export const maxDuration = 60;

// Prodigi softcover files are supplied at trim size: 210 mm square, with no
// bleed or crop marks. Prodigi adds production bleed itself.
const PS = PAGE_SIZE_PT;
const OUTER = SAFE_MARGIN_PT;
const INNER = TEXT_INNER_MARGIN_PT;
const minimumConfiguredPages = Number(process.env.PRINT_MIN_PAGES);
const configuredMinimum = Number.isFinite(minimumConfiguredPages) ? minimumConfiguredPages : 0;
const requestedPageCount = Math.max(DEFAULT_INTERIOR_PAGE_COUNT, configuredMinimum);
const MIN_INTERIOR_PAGES = requestedPageCount % 2 === 0 ? requestedPageCount : requestedPageCount + 1;

const DARK = rgb(0.06, 0.04, 0.14);
const CREAM = rgb(0.992, 0.973, 0.937);
const BROWN = rgb(0.165, 0.082, 0.020);
const GOLD = rgb(0.910, 0.753, 0.478);
const WHITE = rgb(1, 1, 1);

class PreflightError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "PreflightError";
    this.details = details;
  }
}

async function fetchBytes(url) {
  if (!url || url === "__failed__" || !isAllowedFalAsset(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: "error" });
    if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return null;
    if (Number(res.headers.get("content-length") || 0) > 20 * 1024 * 1024) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function embedImg(doc, bytes) {
  if (!bytes) return null;
  try { return await doc.embedJpg(bytes).catch(() => doc.embedPng(bytes)); }
  catch { return null; }
}

function fadeIntoPanel(page, solidTop, fadeTop, color, maxOpacity = 0.9) {
  page.drawRectangle({ x: 0, y: 0, width: PS, height: solidTop, color, opacity: maxOpacity });
  const bands = 110;
  const bandHeight = (fadeTop - solidTop) / bands;
  for (let index = 0; index < bands; index += 1) {
    const progress = (index + 0.5) / bands;
    const opacity = maxOpacity * Math.pow(1 - progress, 1.6);
    if (opacity >= 0.003) page.drawRectangle({ x: 0, y: solidTop + index * bandHeight, width: PS, height: bandHeight, color, opacity });
  }
}

function drawFittedLines(page, layout, { x = 0, bottomY, font, color, opacity = 1, align = "left" }) {
  layout.lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, layout.size);
    const lineX = align === "center" ? (PS - width) / 2 : align === "optical-center" ? x - width / 2 : x;
    const y = bottomY + (layout.lines.length - index - 1) * layout.leading;
    page.drawText(line, { x: lineX, y, size: layout.size, font, color, opacity });
  });
}

function coverLayout(title, font) {
  try {
    return fitTextToBox(title, { font, maxWidth: PS - OUTER * 2, maxHeight: 112, preferredSize: 30, minimumSize: 20, maxLines: 3, lineHeight: 1.08 });
  } catch (error) {
    throw new PreflightError("Cover title cannot fit safely.", [{ code: "cover_title_overflow", message: error.message }]);
  }
}

function titlePageLayout(title, font) {
  try {
    return fitTextToBox(title, { font, maxWidth: PS - OUTER * 2, maxHeight: 154, preferredSize: 42, minimumSize: 28, maxLines: 3, lineHeight: 1.08 });
  } catch (error) {
    throw new PreflightError("Title-page title cannot fit safely.", [{ code: "title_page_overflow", message: error.message }]);
  }
}

function storyLayout(text, font) {
  try {
    return fitTextToBox(text, { font, maxWidth: PS - OUTER - INNER, maxHeight: 322, preferredSize: 17, minimumSize: 15, maxLines: 14, lineHeight: 1.5 });
  } catch (error) {
    throw new PreflightError("Story text cannot fit safely.", [{ code: "story_text_overflow", message: error.message }]);
  }
}

function drawFrontCover(page, { image, title, childName, titleFont, bodyFont }) {
  if (image) page.drawImage(image, { x: 0, y: 0, width: PS, height: PS });
  else page.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
  fadeIntoPanel(page, PS * 0.34, PS * 0.58, DARK, 0.9);
  const layout = coverLayout(title, titleFont);
  const titleBottom = 112;
  page.drawText("MY TINY TALES", { x: OUTER, y: titleBottom + layout.height + 20, size: 10.5, font: titleFont, color: GOLD, opacity: 0.85, characterSpacing: 1.1 });
  drawFittedLines(page, layout, { x: OUTER, bottomY: titleBottom, font: titleFont, color: WHITE });
  const subtitle = controlledCoverSubtitle(childName);
  if (subtitle) page.drawText(subtitle, { x: OUTER, y: 66, size: 11, font: bodyFont, color: GOLD, opacity: 0.82 });
}

function drawTitlePage(page, { title, childName, titleFont, italicFont }) {
  page.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
  // This right-hand page is shifted half a gutter toward the outer edge, so
  // its visual center is not pulled into the binding by raw PDF coordinates.
  const opticalCenter = PS / 2 + INNER_GUTTER_ALLOWANCE_PT / 2;
  const presents = "MY TINY TALES PRESENTS";
  const presentsWidth = titleFont.widthOfTextAtSize(presents, 10);
  page.drawText(presents, { x: opticalCenter - presentsWidth / 2, y: PS * 0.73, size: 10, font: titleFont, color: GOLD, opacity: 0.7, characterSpacing: 1.1 });
  const layout = titlePageLayout(title, titleFont);
  const titleBottom = PS * 0.49 - layout.height / 2;
  drawFittedLines(page, layout, { x: opticalCenter, bottomY: titleBottom, font: titleFont, color: WHITE, align: "optical-center" });
  const dividerY = titleBottom - 30;
  page.drawRectangle({ x: opticalCenter - 28, y: dividerY, width: 56, height: 1.25, color: GOLD, opacity: 0.55 });
  const subtitle = controlledCoverSubtitle(childName);
  const subtitleWidth = italicFont.widthOfTextAtSize(subtitle, 12);
  page.drawText(subtitle, { x: opticalCenter - subtitleWidth / 2, y: dividerY - 38, size: 12, font: italicFont, color: GOLD, opacity: 0.8 });
}

function drawStoryText(page, { text, sceneIndex, bodyFont }) {
  page.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });
  const chapter = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"][sceneIndex];
  page.drawRectangle({ x: OUTER, y: PS - OUTER - 1, width: 22, height: 1, color: BROWN, opacity: 0.5 });
  page.drawText(`CHAPTER ${chapter.toUpperCase()}`, { x: OUTER + 29, y: PS - OUTER - 8, size: 8.5, font: bodyFont, color: BROWN, opacity: 0.68, characterSpacing: 0.6 });
  const layout = storyLayout(text, bodyFont);
  const availableTop = PS - OUTER - 54;
  const availableBottom = OUTER + 34;
  const bottomY = availableBottom + (availableTop - availableBottom - layout.height) / 2;
  drawFittedLines(page, layout, { x: OUTER, bottomY, font: bodyFont, color: BROWN });
  page.drawText(String(sceneIndex * 2 + 1), { x: OUTER, y: OUTER + 1, size: 8.5, font: bodyFont, color: BROWN, opacity: 0.55 });
}

function drawIllustration(page, { image, sceneIndex, bodyFont }) {
  if (!image) throw new PreflightError("Required illustration could not be embedded.", [{ code: "illustration_embed", message: `Illustration ${sceneIndex + 1} is unavailable.` }]);
  page.drawImage(image, { x: 0, y: 0, width: PS, height: PS });
  const number = String(sceneIndex * 2 + 2);
  page.drawText(number, { x: PS - OUTER - bodyFont.widthOfTextAtSize(number, 8.5), y: OUTER + 1, size: 8.5, font: bodyFont, color: WHITE, opacity: 0.55 });
}

function drawEnding(page, { childName, titleFont, italicFont, bodyFont }) {
  page.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
  page.drawText("*   *   *", { x: PS / 2 - 22, y: PS * 0.70, size: 10, font: bodyFont, color: GOLD, opacity: 0.45 });
  const endWidth = titleFont.widthOfTextAtSize("The End", 46);
  page.drawText("The End", { x: (PS - endWidth) / 2, y: PS * 0.53, size: 46, font: titleFont, color: GOLD });
  page.drawRectangle({ x: PS / 2 - 26, y: PS * 0.48, width: 52, height: 1, color: GOLD, opacity: 0.35 });
  const text = `Created with love for ${displayName(childName)}`;
  const width = italicFont.widthOfTextAtSize(text, 12);
  page.drawText(text, { x: (PS - width) / 2, y: PS * 0.37, size: 12, font: italicFont, color: WHITE, opacity: 0.65 });
}

function drawBackCover(page, { titleFont, italicFont }) {
  page.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: DARK });
  // No published Prodigi sticker zone exists, so important content stays in the
  // central field and clear of the lower edge; this is not a claimed spec.
  const brand = "MY TINY TALES";
  const brandWidth = titleFont.widthOfTextAtSize(brand, 14);
  page.drawText(brand, { x: (PS - brandWidth) / 2, y: PS * 0.57, size: 14, font: titleFont, color: GOLD, opacity: 0.8, characterSpacing: 0.8 });
  page.drawRectangle({ x: PS / 2 - 30, y: PS * 0.52, width: 60, height: 1.25, color: GOLD, opacity: 0.45 });
  const line = "A personalised storybook, made with love.";
  const lineWidth = italicFont.widthOfTextAtSize(line, 10.5);
  page.drawText(line, { x: (PS - lineWidth) / 2, y: PS * 0.45, size: 10.5, font: italicFont, color: WHITE, opacity: 0.6 });
}

export async function POST(request) {
  if (!isInternalRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const { coverFalUrl, pageFalUrls, story, childName } = body;
  if (!isAllowedFalAsset(coverFalUrl) || !Array.isArray(pageFalUrls) || pageFalUrls.length !== 8 || pageFalUrls.some((url) => !isAllowedFalAsset(url))) {
    return Response.json({ error: "Invalid book assets" }, { status: 400 });
  }
  const preflight = preflightBook({ story, childName, coverImage: coverFalUrl, sceneImages: pageFalUrls, minimumPages: MIN_INTERIOR_PAGES });
  if (!preflight.ok) return Response.json({ error: "Book failed print preflight.", preflight }, { status: 422 });

  try {
    fal.config({ credentials: process.env.FAL_API_KEY });
    const [coverBytes, ...sceneBytes] = await Promise.all([coverFalUrl, ...pageFalUrls].map(fetchBytes));
    if (!coverBytes || sceneBytes.some((bytes) => !bytes)) throw new PreflightError("Required image asset could not be downloaded.", [{ code: "image_download", message: "One or more required images are unavailable." }]);

    const coverDoc = await PDFDocument.create();
    coverDoc.registerFontkit(fontkit);
    const coverTitleFont = await coverDoc.embedFont(LATO_BOLD_TTF, { subset: true });
    const coverBodyFont = await coverDoc.embedFont(LIBRE_ITALIC_TTF, { subset: true });
    const coverPage = coverDoc.addPage([PS, PS]);
    drawFrontCover(coverPage, { image: await embedImg(coverDoc, coverBytes), title: preflight.title, childName: preflight.childName, titleFont: coverTitleFont, bodyFont: coverBodyFont });

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const titleFont = await doc.embedFont(LATO_BOLD_TTF, { subset: true });
    const bodyFont = await doc.embedFont(LIBRE_REGULAR_TTF, { subset: true });
    const italicFont = await doc.embedFont(LIBRE_ITALIC_TTF, { subset: true });
    const interiorCoverImage = await embedImg(doc, coverBytes);
    const sceneImages = await Promise.all(sceneBytes.map((bytes) => embedImg(doc, bytes)));

    for (const entry of preflight.plan) {
      const page = doc.addPage([PS, PS]);
      if (entry.type === "front_cover") drawFrontCover(page, { image: interiorCoverImage, title: preflight.title, childName: preflight.childName, titleFont, bodyFont: italicFont });
      else if (entry.type === "flyleaf" || entry.type === "filler") page.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: CREAM });
      else if (entry.type === "title") drawTitlePage(page, { title: preflight.title, childName: preflight.childName, titleFont, italicFont });
      else if (entry.type === "story_text") drawStoryText(page, { text: story.pages[entry.sceneIndex].text, sceneIndex: entry.sceneIndex, bodyFont });
      else if (entry.type === "illustration") drawIllustration(page, { image: sceneImages[entry.sceneIndex], sceneIndex: entry.sceneIndex, bodyFont });
      else if (entry.type === "ending") drawEnding(page, { childName: preflight.childName, titleFont, italicFont, bodyFont });
      else if (entry.type === "back_cover") drawBackCover(page, { titleFont, italicFont });
    }

    const rendered = validatePdfPlan(doc, preflight.plan);
    if (!rendered.ok) throw new PreflightError("Rendered PDF failed preflight.", rendered.errors);
    const [coverPdfBytes, interiorPdfBytes] = await Promise.all([coverDoc.save(), doc.save()]);
    const [coverPdfUrl, interiorPdfUrl] = await Promise.all([
      fal.storage.upload(new File([coverPdfBytes], "cover.pdf", { type: "application/pdf" })),
      fal.storage.upload(new File([interiorPdfBytes], "interior.pdf", { type: "application/pdf" })),
    ]);
    return Response.json({
      coverPdfUrl,
      interiorPdfUrl,
      interiorPageCount: preflight.plan.length,
      preflight: { ok: true, pagePlan: preflight.plan.map(({ type, intentionalBlank, reason }) => ({ type, intentionalBlank, reason })) },
    });
  } catch (error) {
    const isPreflight = error instanceof PreflightError;
    console.error("generate-book-pdf error:", error.message, isPreflight ? error.details : error.stack);
    return Response.json({ error: isPreflight ? "Book failed print preflight." : (error.message || "PDF generation failed"), preflight: isPreflight ? { ok: false, errors: error.details } : undefined }, { status: isPreflight ? 422 : 500 });
  }
}
