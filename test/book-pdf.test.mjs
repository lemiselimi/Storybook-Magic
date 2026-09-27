import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { renderBookPdf, storyTextLayout } from "../lib/book-pdf.js";
import { hasCurrentPrintLayout, PRINT_LAYOUT_VERSION, PAGE_SIZE_PT } from "../lib/book-layout.js";

const story = JSON.parse(await fs.readFile(new URL("fixtures/loli-read-aloud.json", import.meta.url), "utf8"));
const image = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#a94f38" } }).png().toBuffer();
const input = { story, childName: "Loli", coverBytes: image, sceneBytes: Array(8).fill(image) };

test("production renderer emits the complete 22-page square book and a matching cover", async () => {
  const result = await renderBookPdf(input);
  const book = await PDFDocument.load(result.interiorPdfBytes);
  const cover = await PDFDocument.load(result.coverPdfBytes);
  assert.equal(book.getPageCount(), 22);
  assert.equal(cover.getPageCount(), 1);
  for (const page of book.getPages()) {
    assert.ok(Math.abs(page.getWidth() - PAGE_SIZE_PT) < .01);
    assert.ok(Math.abs(page.getHeight() - PAGE_SIZE_PT) < .01);
  }
  for (let i = 0; i < 8; i++) {
    assert.deepEqual(result.pagePlan[4 + i * 2], { type: "story_text", sceneIndex: i });
    assert.deepEqual(result.pagePlan[5 + i * 2], { type: "illustration", sceneIndex: i });
  }
  assert.equal(hasCurrentPrintLayout({ preflight: result.preflight }), true);
});

test("missing or corrupt artwork fails instead of emitting a blank printed page", async () => {
  await assert.rejects(renderBookPdf({ ...input, sceneBytes: [...Array(7).fill(image), null] }), /illustration/i);
  await assert.rejects(renderBookPdf({ ...input, coverBytes: Buffer.from("not an image") }));
});

test("legacy PDF approvals cannot silently pass the new print layout gate", () => {
  assert.equal(hasCurrentPrintLayout({ preflight: { ok: true } }), false);
  assert.equal(hasCurrentPrintLayout({ preflight: { ok: true, layoutVersion: "old" } }), false);
  assert.equal(hasCurrentPrintLayout({ preflight: { ok: false, layoutVersion: PRINT_LAYOUT_VERSION } }), false);
});

test("read-aloud line breaks survive layout and oversized copy fails explicitly", () => {
  const font = { widthOfTextAtSize: (text, size) => text.length * size * .52 };
  const result = storyTextLayout("One boot.\nTwo boots.", font);
  assert.equal(result.layouts.length, 2);
  assert.deepEqual(result.layouts.map(p => p.lines), [["One boot."], ["Two boots."]]);
  assert.throws(() => storyTextLayout("impossiblylongword".repeat(100), font), /does not fit/);
});
