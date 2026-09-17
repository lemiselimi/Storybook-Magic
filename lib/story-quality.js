// Deterministic acceptance checks for a generated story before it reaches the
// personalised preview or the book-production pipeline.
export const MAX_WORDS_PER_PAGE = { "1-3": 18, "4-6": 40, "7-9": 54, "10-12": 64 };

const PLACEHOLDER = /\{\{?[^}]+\}\}?|\b(?:undefined|null)\b/i;

export function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

export function validateStory(story, { childName, ageBand }) {
  if (!story || typeof story !== "object") return "Story response is missing.";
  if (!String(story.title || "").trim() || PLACEHOLDER.test(story.title)) return "Story title is invalid.";
  if (!String(story.dedication || "").trim() || PLACEHOLDER.test(story.dedication)) return "Story dedication is invalid.";
  if (!Array.isArray(story.pages) || story.pages.length !== 8) return "Story must contain exactly eight scenes.";

  if (childName && !story.title.toLocaleLowerCase().includes(childName.toLocaleLowerCase())) {
    return "Story title does not include the child's name.";
  }

  const maxWords = MAX_WORDS_PER_PAGE[ageBand];
  for (let index = 0; index < story.pages.length; index += 1) {
    const page = story.pages[index];
    if (page?.pageNum !== index + 1 || !String(page?.text || "").trim() || !String(page?.illustration || "").trim()) {
      return `Story scene ${index + 1} is incomplete.`;
    }
    if (PLACEHOLDER.test(page.text) || PLACEHOLDER.test(page.illustration)) return `Story scene ${index + 1} contains an unresolved value.`;
    if (wordCount(page.text) > maxWords) return `Story scene ${index + 1} is too long for the printed text page.`;
  }
  if (childName && !story.pages.some((page) => page.text.toLocaleLowerCase().includes(childName.toLocaleLowerCase()))) {
    return "Story does not include the child's name.";
  }
  return null;
}
