// Verify the interior PDF layout against the deployed generate-book-pdf route.
import { fal } from "@fal-ai/client";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = await fs.readFile(path.join(root, ".env.local"), "utf8");
fal.config({ credentials: env.match(/^FAL_API_KEY=(.+)$/m)[1].trim() });

const up = async (file) => {
  const buf = await fs.readFile(path.join(root, "public/examples", file));
  return fal.storage.upload(new File([new Blob([buf])], file, { type: "image/jpeg" }));
};
const imgs = await Promise.all(["example-1.jfif", "example-2.jfif", "example-3.jfif", "example-4.jfif"].map(up));
const story = {
  title: "Loli's Deep Blue Splash",
  dedication: "For Loli, our little wave who lights up the sea.",
  pages: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ pageNum: n, text: "A test page of story text to check the spread layout renders correctly and reads well.", illustration: "" })),
};

const res = await fetch("https://mytinytales.studio/api/generate-book-pdf", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ coverFalUrl: imgs[0], pageFalUrls: [imgs[0], imgs[1], imgs[2], imgs[3], imgs[0], imgs[1], imgs[2], imgs[3]], story, childName: "Loli" }),
});
const j = await res.json();
console.log("route reported interiorPageCount:", j.interiorPageCount);

const bytes = new Uint8Array(await (await fetch(j.interiorPdfUrl)).arrayBuffer());
const src = await PDFDocument.load(bytes);
const n = src.getPageCount();
console.log("actual PDF pages:", n);

await fs.mkdir(path.join(root, "compare"), { recursive: true });
// Save the print cover wrap (back | spine | front) for the seam check.
await fs.writeFile(path.join(root, "compare/vp-coverwrap.pdf"), new Uint8Array(await (await fetch(j.coverPdfUrl)).arrayBuffer()));
for (const [label, idx] of [["frontcover", 0], ["gallery1", 17], ["backcover", n - 1]]) {
  const d = await PDFDocument.create();
  const [p] = await d.copyPages(src, [idx]);
  d.addPage(p);
  await fs.writeFile(path.join(root, `compare/vp-${label}.pdf`), await d.save());
}
console.log("wrote compare/vp-belongs.pdf, vp-gallery.pdf, vp-backcover.pdf");
