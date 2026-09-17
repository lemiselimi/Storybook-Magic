import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const source = fs.readFileSync(path.resolve("lib/book-layout.js"), "utf8")
  .replaceAll("export const ", "const ")
  .replaceAll("export function ", "function ");
const layout = Function(`${source}\nreturn { DEFAULT_INTERIOR_PAGE_COUNT, buildInteriorPagePlan, controlledCoverSubtitle, fitTextToBox, preflightBook, validatePagePlan };`)();
const { DEFAULT_INTERIOR_PAGE_COUNT, buildInteriorPagePlan, controlledCoverSubtitle, fitTextToBox, preflightBook, validatePagePlan } = layout;

const imageUrls = Array.from({ length: 8 }, (_, index) => `https://assets.example.test/${index}.jpg`);
const pages = Array.from({ length: 8 }, (_, index) => ({ pageNum: index + 1, text: `A clear, complete story moment for scene ${index + 1}.` }));
const validBook = (overrides = {}) => ({
  childName: "Elora",
  coverImage: "https://assets.example.test/cover.jpg",
  sceneImages: imageUrls,
  story: { title: "Elora's Sleepy Star Hunt", dedication: "For Elora, a quiet dreamer.", pages },
  ...overrides,
});
const fakeFont = { widthOfTextAtSize: (text, size) => text.length * size * 0.5 };

test("normal short name and title pass preflight", () => {
  const result = preflightBook(validBook());
  assert.equal(result.ok, true);
  assert.equal(result.plan.length, DEFAULT_INTERIOR_PAGE_COUNT);
});

test("long child names remain controlled cover copy", () => {
  const subtitle = controlledCoverSubtitle("Alexandria-Marguerite");
  assert.equal(subtitle, "A Tiny Tale starring Alexandria-marguerite");
  assert.equal(preflightBook(validBook({ childName: "Alexandria-Marguerite" })).ok, true);
});

test("long titles fit by measured wrapping rather than truncation", () => {
  const layout = fitTextToBox("Alexander's Journey Through the Stars and Into the Quiet Moonlit Garden", {
    font: fakeFont, maxWidth: 280, maxHeight: 160, preferredSize: 30, minimumSize: 18, maxLines: 3,
  });
  assert.ok(layout.lines.length <= 3);
  assert.ok(layout.size >= 18);
  assert.ok(!layout.lines.join(" ").includes("..."));
});

test("maximum realistic story length fits or fails explicitly, never clips", () => {
  const copy = Array.from({ length: 125 }, () => "gentle").join(" ");
  assert.throws(() => fitTextToBox(copy, { font: fakeFont, maxWidth: 220, maxHeight: 120, preferredSize: 17, minimumSize: 15, maxLines: 5 }));
});

test("empty required child name and title fail preflight", () => {
  const result = preflightBook(validBook({ childName: "", story: { title: "", pages } }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "child_name_missing"));
  assert.ok(result.errors.some((error) => error.code === "title_missing"));
});

test("unresolved template variables are rejected", () => {
  const result = preflightBook(validBook({ story: { title: "{{childName}} and the Moon", pages } }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "title_placeholder"));
});

test("the final filler page is explicit and intentional", () => {
  const plan = buildInteriorPagePlan();
  assert.deepEqual(plan.at(-2), { type: "filler", intentionalBlank: true, reason: "print_minimum" });
  assert.equal(validatePagePlan(plan).ok, true);
});

test("an accidental blank middle page is rejected", () => {
  const plan = buildInteriorPagePlan();
  plan[6] = { type: "filler", intentionalBlank: true, reason: "print_minimum" };
  const result = validatePagePlan(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "story_pairing"));
});

test("missing or wrong-count illustrations fail preflight", () => {
  const missing = preflightBook(validBook({ sceneImages: imageUrls.map((url, index) => index === 3 ? "" : url) }));
  assert.ok(missing.errors.some((error) => error.code === "illustration_missing"));
  const count = preflightBook(validBook({ sceneImages: imageUrls.slice(0, 7) }));
  assert.ok(count.errors.some((error) => error.code === "illustration_count"));
});

test("minimum page count is always even and met", () => {
  const plan = buildInteriorPagePlan({ minimumPages: 23 });
  assert.equal(plan.length, 24);
  assert.equal(plan.length % 2, 0);
});

test("cover overflow is a hard failure, not cropped text", () => {
  assert.throws(() => fitTextToBox("Averyveryveryveryveryveryveryveryveryverylongunbreakabletitle", {
    font: fakeFont, maxWidth: 150, maxHeight: 90, preferredSize: 30, minimumSize: 20, maxLines: 3,
  }));
});

test("generated dedication fragments can never become cover copy", () => {
  const defective = "For Elora, our sleepy little dreamer. An Off to Dr...";
  const coverCopy = controlledCoverSubtitle("Elora");
  assert.equal(coverCopy, "A Tiny Tale starring Elora");
  assert.ok(!coverCopy.includes("Off to Dr"));
  assert.notEqual(coverCopy, defective);
});
