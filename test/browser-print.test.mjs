import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const file = new URL("../app/components/BrowserPrintBook.tsx", import.meta.url);
const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const exports = {};
Function("require", "exports", compiled)(createRequire(file), exports);
const story = JSON.parse(fs.readFileSync(new URL("fixtures/loli-read-aloud.json", import.meta.url), "utf8"));

test("print-at-home uses 22 individual square-book pages, not landscape spread screenshots", () => {
  const html = renderToStaticMarkup(createElement(exports.default, {
    story, childName: "Loli", coverImage: "/cover.png", images: Array.from({ length: 8 }, (_, i) => `/scene-${i}.png`),
  }));
  const types = [...html.matchAll(/data-page-type="([^"]+)"/g)].map(m => m[1]);
  assert.equal(types.length, 22);
  assert.deepEqual(types.slice(0, 4), ["front_cover", "title", "dedication", "belongs"]);
  for (let i = 4; i < 20; i += 2) assert.deepEqual(types.slice(i, i + 2), ["story_text", "illustration"]);
  assert.deepEqual(types.slice(-2), ["ending", "back_cover"]);
  const cover = html.slice(html.indexOf('data-page-type="front_cover"'), html.indexOf('data-page-type="title"'));
  assert.ok(cover.includes("A Tiny Tale starring Loli"));
  assert.ok(!cover.includes(story.dedication));
  assert.ok(html.includes("white-space:pre-line"));
});
