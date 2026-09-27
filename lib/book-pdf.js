import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { LIBRE_REGULAR_TTF, LIBRE_ITALIC_TTF, LATO_BOLD_TTF } from "../app/api/generate-book-pdf/fonts.js";
import { PAGE_SIZE_PT as PS, PRINT_LAYOUT_VERSION, displayName, controlledCoverSubtitle, fitTextToBox, preflightBook, validatePdfPlan } from "./book-layout.js";

const PAPER = rgb(.978, .961, .922);
const INK = rgb(.122, .165, .157);
const CLAY = rgb(.58, .26, .18);
const GOLD = rgb(.78, .57, .26);
const MARGIN = 54;

function paper(page) {
  page.drawRectangle({ x: 0, y: 0, width: PS, height: PS, color: PAPER });
}

// Small rings echo the page-turn motif without competing with the story.
function ornament(page, x, y) {
  for (const [dx, dy, radius] of [[0, 0, 13], [27, 11, 8], [-22, 20, 5]]) {
    page.drawCircle({ x: x + dx, y: y + dy, size: radius, borderColor: GOLD, borderWidth: 1, borderOpacity: .65 });
  }
}

function lines(page, layout, font, { x = MARGIN, top, color = INK, centered = false } = {}) {
  layout.lines.forEach((text, i) => page.drawText(text, {
    x: centered ? x - font.widthOfTextAtSize(text, layout.size) / 2 : x,
    y: top - layout.size - i * layout.leading, font, size: layout.size, color,
  }));
}

function fitted(text, font, width, height, size, min = size, maxLines = 12) {
  return fitTextToBox(text, { font, maxWidth: width, maxHeight: height, preferredSize: size, minimumSize: min, maxLines, lineHeight: 1.45 });
}

// Preserve intentional read-aloud line breaks. Fit every line by actual font metrics.
export function storyTextLayout(text, font) {
  const paragraphs = String(text).split(/\n+/).map(line => line.trim()).filter(Boolean);
  for (let size = 23; size >= 17; size -= .5) {
    let layouts;
    try { layouts = paragraphs.map(line => fitted(line, font, PS - 2 * MARGIN - 18, 2000, size, size, 60)); }
    catch { continue; }
    const height = layouts.reduce((sum, item) => sum + item.height, 0) + Math.max(0, layouts.length - 1) * 5;
    if (height <= 365) return { layouts, height };
  }
  throw new Error("Story text does not fit safely; revise it before printing.");
}

function imagePage(page, image) {
  if (!image) throw new Error("A required illustration is missing.");
  // Contain rather than stretch or discard the edges of a non-square source.
  paper(page);
  const scale = Math.min(PS / image.width, PS / image.height);
  const width = image.width * scale, height = image.height * scale;
  page.drawImage(image, { x: (PS - width) / 2, y: (PS - height) / 2, width, height });
}

function frontCover(page, image, title, name, fonts) {
  imagePage(page, image);
  // A compact opaque paper panel keeps the art bright and the title readable.
  const titleLayout = fitted(title, fonts.body, PS - MARGIN * 2, 114, 30, 21, 3);
  const panelHeight = Math.max(160, titleLayout.height + 95);
  page.drawRectangle({ x: 0, y: 0, width: PS, height: panelHeight, color: PAPER });
  lines(page, fitted("MY TINY TALES", fonts.label, 400, 20, 10), fonts.label, { top: panelHeight - 18 });
  lines(page, titleLayout, fonts.body, { top: panelHeight - 43 });
  const subtitle = fitted(controlledCoverSubtitle(name), fonts.italic, PS - MARGIN * 2, 36, 11, 9, 2);
  lines(page, subtitle, fonts.italic, { top: 45, color: CLAY });
}

function centeredPage(page, heading, copy, fonts, { title = false } = {}) {
  paper(page);
  ornament(page, PS / 2, PS * .77);
  const headline = fitted(heading, fonts.body, PS - 2 * MARGIN, 150, title ? 32 : 28, 20, 3);
  lines(page, headline, fonts.body, { x: PS / 2, top: PS * .64, centered: true });
  if (copy) {
    const body = fitted(copy, fonts.italic, PS - 2 * MARGIN, 120, 15, 12, 5);
    lines(page, body, fonts.italic, { x: PS / 2, top: PS * .64 - headline.height - 34, centered: true, color: CLAY });
  }
}

function storyPage(page, text, fonts, sceneIndex) {
  paper(page);
  const layout = storyTextLayout(text, fonts.body);
  let top = PS / 2 + layout.height / 2 + 8;
  for (const paragraph of layout.layouts) {
    lines(page, paragraph, fonts.body, { x: MARGIN, top });
    top -= paragraph.height + 5;
  }
  ornament(page, PS / 2 - 9, 83);
  // Small outer-edge folio; the inner margin is larger on this left-hand page.
  page.drawText(String(4 + sceneIndex * 2), { x: MARGIN, y: 30, font: fonts.label, size: 9, color: CLAY });
}

async function embedImage(doc, bytes) {
  if (!bytes?.length) throw new Error("A required image could not be downloaded.");
  return doc.embedJpg(bytes).catch(() => doc.embedPng(bytes));
}

async function embedFonts(doc) {
  doc.registerFontkit(fontkit);
  return {
    body: await doc.embedFont(LIBRE_REGULAR_TTF, { subset: true }),
    italic: await doc.embedFont(LIBRE_ITALIC_TTF, { subset: true }),
    label: await doc.embedFont(LATO_BOLD_TTF, { subset: true }),
  };
}

// Production and offline proofs use this exact renderer: no network or uploads.
export async function renderBookPdf({ story, childName, coverBytes, sceneBytes, minimumPages }) {
  const check = preflightBook({ story, childName, coverImage: coverBytes?.length ? "available" : "", sceneImages: sceneBytes?.map(bytes => bytes?.length ? "available" : ""), minimumPages });
  if (!check.ok) throw new Error(check.errors.map(error => error.message).join(" "));
  const doc = await PDFDocument.create();
  doc.setTitle(story.title);
  doc.setAuthor("My Tiny Tales");
  doc.setSubject(`Print layout ${PRINT_LAYOUT_VERSION}`);
  const fonts = await embedFonts(doc);
  const cover = await embedImage(doc, coverBytes);
  const images = await Promise.all(sceneBytes.map(bytes => embedImage(doc, bytes)));
  const name = displayName(childName);
  for (const entry of check.plan) {
    const page = doc.addPage([PS, PS]);
    switch (entry.type) {
      case "front_cover": frontCover(page, cover, story.title, name, fonts); break;
      case "title": centeredPage(page, story.title, "A My Tiny Tales story", fonts, { title: true }); break;
      case "dedication": centeredPage(page, "For you", story.dedication || `For ${name}, with love.`, fonts); break;
      case "belongs": centeredPage(page, `This book belongs to ${name}`, "A little adventure to read together, again and again.", fonts); break;
      case "story_text": storyPage(page, story.pages[entry.sceneIndex].text, fonts, entry.sceneIndex); break;
      case "illustration": imagePage(page, images[entry.sceneIndex]); break;
      case "ending": centeredPage(page, "The End", `Made with love for ${name}.`, fonts); break;
      case "back_cover": {
        paper(page);
        ornament(page, PS / 2, PS * .73);
        const title = fitted(story.title, fonts.body, PS - 2 * MARGIN, 120, 26, 20, 3);
        lines(page, title, fonts.body, { x: PS / 2, top: PS * .63, centered: true });
        const copy = fitted(`A little adventure starring ${name}. A story to share, and a book to keep.`, fonts.italic, PS - 2 * MARGIN, 100, 15, 12, 4);
        lines(page, copy, fonts.italic, { x: PS / 2, top: PS * .63 - title.height - 30, centered: true, color: CLAY });
        lines(page, fitted("MY TINY TALES", fonts.label, 400, 20, 10), fonts.label, { x: PS / 2, top: 190, centered: true });
        // Leave the lower 45 mm free for the printer's production label.
        break;
      }
      case "filler": paper(page); break;
      default: throw new Error(`Unsupported print page: ${entry.type}`);
    }
  }
  const rendered = validatePdfPlan(doc, check.plan);
  if (!rendered.ok) throw new Error(rendered.errors.map(error => error.message).join(" "));
  const coverDoc = await PDFDocument.create();
  const [coverPage] = await coverDoc.copyPages(doc, [0]);
  coverDoc.addPage(coverPage);
  return {
    coverPdfBytes: await coverDoc.save(), interiorPdfBytes: await doc.save(), pagePlan: check.plan,
    preflight: { ok: true, layoutVersion: PRINT_LAYOUT_VERSION, pagePlan: check.plan },
  };
}
