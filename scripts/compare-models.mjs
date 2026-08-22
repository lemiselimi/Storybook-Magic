// A/B: current PuLID vs FLUX.2 [pro] edit — same reference + scene, timed.
// Usage: node scripts/compare-models.mjs [refPathOrUrl] [scene text]
// Defaults to a synthetic example child so no real photo is needed.
import { fal } from "@fal-ai/client";
import { NEGATIVE_PROMPT } from "../app/api/_lib/fal.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// Load FAL key from .env.local
const env = await fs.readFile(path.join(root, ".env.local"), "utf8");
const key = env.match(/^FAL_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("FAL_API_KEY not found in .env.local");
fal.config({ credentials: key });

const REF   = process.argv[2] || "public/examples/example-1.webp";
const SCENE = process.argv[3] ||
  "standing at the edge of a glowing magical forest at dusk, wide-eyed with wonder, " +
  "fireflies drifting around, discovering a hidden doorway made of warm light";

// Resolve reference to a fal-hosted URL (both models need a URL)
let refUrl;
if (/^https?:\/\//.test(REF)) {
  refUrl = REF;
} else {
  const buf = await fs.readFile(path.join(root, REF));
  refUrl = await fal.storage.upload(new File([new Blob([buf])], "ref.jpg", { type: "image/jpeg" }));
}
console.log("Reference:", REF, "->", refUrl, "\nScene:", SCENE, "\n");

const STYLE = "cinematic Pixar-Disney 3D animated storybook illustration, soft warm cinematic lighting, highly detailed, vibrant, full body in scene";

// PuLID prompt mirrors generate-scene's transformation of "a photo of TOK,"
const pulidPrompt = `A Pixar-Disney 3D animated storybook illustration of a child, ${SCENE}. ${STYLE}`;
// FLUX.2 uses natural language + reads identity from the input image (mirrors
// the IDENTITY_LEAD used in app/api/generate-scene/route.js)
const flux2Prompt = `A soft Pixar-Disney style 3D animated storybook illustration of the exact same child from the reference photo, faithfully preserving their face shape, eye colour and shape, eyebrows, nose, mouth, skin tone and hairstyle so the character stays clearly recognisable as this specific child. Scene: ${SCENE}. ${STYLE}`;

async function timed(label, fn) {
  const t = Date.now();
  try {
    const url = await fn();
    return { label, url, secs: ((Date.now() - t) / 1000).toFixed(1) };
  } catch (e) {
    return { label, error: e.message, secs: ((Date.now() - t) / 1000).toFixed(1) };
  }
}

const [pulid, flux2] = await Promise.all([
  timed("pulid", async () => {
    const r = await fal.subscribe("fal-ai/flux-pulid", {
      input: {
        reference_image_url: refUrl,
        prompt: pulidPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        num_inference_steps: 25,
        guidance_scale: 4.0,
        true_cfg: 1,
        id_weight: 0.7,
        num_images: 1,
        image_size: "square_hd",
      },
    });
    return r.data.images[0].url;
  }),
  timed("flux2", async () => {
    const r = await fal.subscribe("fal-ai/flux-2-pro/edit", {
      input: {
        prompt: flux2Prompt,
        image_urls: [refUrl],
        image_size: { width: 1024, height: 1024 },
      },
    });
    return r.data.images[0].url;
  }),
]);

await fs.mkdir(path.join(root, "compare"), { recursive: true });
for (const res of [pulid, flux2]) {
  console.log(res);
  if (res.url) {
    const img = Buffer.from(await (await fetch(res.url)).arrayBuffer());
    await fs.writeFile(path.join(root, `compare/${res.label}.jpg`), img);
  }
}
console.log("\nDone. Wrote compare/pulid.jpg and compare/flux2.jpg");
