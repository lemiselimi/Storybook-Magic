// Deterministic print layout and preflight rules for the Prodigi softcover book.
// Prodigi requests trim-size artwork only: no bleed or crop marks are added here.

export const MM_TO_PT = 72 / 25.4;
export const TRIM_MM = 210;
export const PAGE_SIZE_PT = TRIM_MM * MM_TO_PT;
export const SAFE_MARGIN_PT = 10 * MM_TO_PT;
export const INNER_GUTTER_ALLOWANCE_PT = 6 * MM_TO_PT;
export const TEXT_INNER_MARGIN_PT = SAFE_MARGIN_PT + INNER_GUTTER_ALLOWANCE_PT;
export const DEFAULT_INTERIOR_PAGE_COUNT = 22;
export const STORY_SCENE_COUNT = 8;

const PLACEHOLDER = /\{\{?[^}]+\}\}?/;
const INVALID_RENDERED_VALUE = /\b(?:undefined|null|nan)\b/i;
const INTERNAL_TEMPLATE_MARKER = /(?:<\/?(?:child|story|adventure)_[^>]+>|\b(?:theme_id|story_arc|adventure_title)\b)/i;

export function printableText(value) {
  return String(value ?? "")
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayName(value) {
  const name = printableText(value);
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}` : "";
}

// Cover copy deliberately has no input path for generated dedication/subtitle copy.
export function controlledCoverSubtitle(childName) {
  const name = displayName(childName);
  return name ? `A Tiny Tale starring ${name}` : "";
}

export function buildInteriorPagePlan({ sceneCount = STORY_SCENE_COUNT, minimumPages = DEFAULT_INTERIOR_PAGE_COUNT } = {}) {
  const plan = [
    { type: "front_cover" },
    { type: "flyleaf", intentionalBlank: true, reason: "inside_front_cover" },
    { type: "title" },
  ];

  for (let sceneIndex = 0; sceneIndex < sceneCount; sceneIndex += 1) {
    plan.push({ type: "story_text", sceneIndex });
    plan.push({ type: "illustration", sceneIndex });
  }

  plan.push({ type: "ending" });
  const required = Math.max(minimumPages, plan.length + 1);
  const evenPageCount = required % 2 === 0 ? required : required + 1;
  while (plan.length < evenPageCount - 1) {
    plan.push({ type: "filler", intentionalBlank: true, reason: "print_minimum" });
  }
  plan.push({ type: "back_cover" });
  return plan;
}

export function validatePagePlan(plan, { minimumPages = DEFAULT_INTERIOR_PAGE_COUNT } = {}) {
  const errors = [];
  if (!Array.isArray(plan) || plan.length < minimumPages || plan.length % 2 !== 0) {
    addError(errors, "page_count", "Interior page count does not meet the print requirement.");
    return { ok: false, errors };
  }
  if (plan[0]?.type !== "front_cover" || plan[1]?.type !== "flyleaf" || plan[2]?.type !== "title" || plan.at(-1)?.type !== "back_cover") {
    addError(errors, "page_order", "Required front matter or back cover is out of order.");
  }
  for (let sceneIndex = 0; sceneIndex < STORY_SCENE_COUNT; sceneIndex += 1) {
    const offset = 3 + sceneIndex * 2;
    if (plan[offset]?.type !== "story_text" || plan[offset]?.sceneIndex !== sceneIndex || plan[offset + 1]?.type !== "illustration" || plan[offset + 1]?.sceneIndex !== sceneIndex) {
      addError(errors, "story_pairing", `Story scene ${sceneIndex + 1} does not have its expected text/illustration pair.`);
    }
  }
  const endingIndex = 3 + STORY_SCENE_COUNT * 2;
  if (plan[endingIndex]?.type !== "ending") addError(errors, "ending_page", "Required ending page is missing.");
  for (let index = endingIndex + 1; index < plan.length - 1; index += 1) {
    const page = plan[index];
    if (page?.type !== "filler" || !page.intentionalBlank || page.reason !== "print_minimum") {
      addError(errors, "unexpected_blank_page", `Page ${index + 1} is not an intentional print-minimum filler page.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function addError(errors, code, message) {
  errors.push({ code, message });
}

function validateText(errors, value, field, { required = false } = {}) {
  const text = printableText(value);
  if (required && !text) addError(errors, `${field}_missing`, `${field} is required.`);
  if (text && PLACEHOLDER.test(text)) addError(errors, `${field}_placeholder`, `${field} contains an unresolved placeholder.`);
  if (text && INVALID_RENDERED_VALUE.test(text)) addError(errors, `${field}_invalid_value`, `${field} contains an invalid rendered value.`);
  if (text && INTERNAL_TEMPLATE_MARKER.test(text)) addError(errors, `${field}_internal_marker`, `${field} contains internal template data.`);
  return text;
}

export function preflightBook({ story, childName, coverImage, sceneImages, minimumPages = DEFAULT_INTERIOR_PAGE_COUNT } = {}) {
  const errors = [];
  const name = validateText(errors, childName, "child_name", { required: true });
  const title = validateText(errors, story?.title, "title", { required: true });
  const pages = Array.isArray(story?.pages) ? story.pages : [];
  const images = Array.isArray(sceneImages) ? sceneImages : [];

  if (!printableText(coverImage)) addError(errors, "cover_missing", "A cover illustration is required.");
  if (pages.length !== STORY_SCENE_COUNT) addError(errors, "story_scene_count", `Expected ${STORY_SCENE_COUNT} story scenes, found ${pages.length}.`);
  if (images.length !== STORY_SCENE_COUNT) addError(errors, "illustration_count", `Expected ${STORY_SCENE_COUNT} illustrations, found ${images.length}.`);

  const seenStoryCopy = new Set();
  for (let index = 0; index < STORY_SCENE_COUNT; index += 1) {
    const page = pages[index];
    const text = validateText(errors, page?.text, `story_${index + 1}`, { required: true });
    if (text) {
      const fingerprint = text.toLocaleLowerCase();
      if (seenStoryCopy.has(fingerprint)) addError(errors, "duplicate_story_copy", `Story page ${index + 1} duplicates another story page.`);
      seenStoryCopy.add(fingerprint);
    }
    if (!printableText(images[index])) addError(errors, "illustration_missing", `Illustration ${index + 1} is missing.`);
  }

  const plan = buildInteriorPagePlan({ sceneCount: pages.length || STORY_SCENE_COUNT, minimumPages });
  const planValidation = validatePagePlan(plan, { minimumPages });
  errors.push(...planValidation.errors);

  return { ok: errors.length === 0, errors, plan, title, childName: name };
}

export function fitTextToBox(text, { font, maxWidth, maxHeight, preferredSize, minimumSize, maxLines, lineHeight = 1.25 }) {
  const content = printableText(text);
  if (!content) throw new Error("Required text is empty.");

  for (let size = preferredSize; size >= minimumSize; size -= 0.25) {
    const words = content.split(" ");
    const lines = [];
    let line = "";
    let overflow = false;
    for (const word of words) {
      if (font.widthOfTextAtSize(word, size) > maxWidth) { overflow = true; break; }
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    const leading = size * lineHeight;
    if (!overflow && lines.length <= maxLines && lines.length * leading <= maxHeight) {
      return { lines, size, leading, height: lines.length * leading };
    }
  }
  throw new Error("Text does not fit within its print-safe area.");
}

export function validatePdfPlan(doc, plan) {
  const errors = [];
  if (doc.getPageCount() !== plan.length) addError(errors, "pdf_page_count", "Rendered PDF page count does not match the page plan.");
  for (const [index, page] of doc.getPages().entries()) {
    const { width, height } = page.getSize();
    if (Math.abs(width - PAGE_SIZE_PT) > 0.1 || Math.abs(height - PAGE_SIZE_PT) > 0.1) {
      addError(errors, "pdf_dimensions", `Page ${index + 1} is not at the required 210 mm trim size.`);
    }
  }
  return { ok: errors.length === 0, errors };
}
