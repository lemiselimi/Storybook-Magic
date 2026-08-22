// Likeness bake-off: run ONE real child photo through 3 identity approaches and
// save the results side by side so we can pick the best face preservation.
// Usage: node scripts/likeness-bakeoff.mjs [refPathOrUrl] [scene text]
// Default reference: test-child.jpg in the project root (drop a real photo there).
import { fal } from "@fal-ai/client";
import { NEGATIVE_PROMPT } from "../app/api/_lib/fal.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = await fs.readFile(path.join(root, ".env.local"), "utf8");
const key = env.match(/^FAL_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("FAL_API_KEY not found in .env.local");
fal.config({ credentials: key });

const REF   = process.argv[2] || "test-child.jpg";
const SCENE = process.argv[3] ||
  "standing at the edge of a glowing magical forest at dusk, wide-eyed with wonder, " +
  "fireflies drifting around, discovering a hidden doorway made of warm light";

// Resolve the reference to a fal-hosted URL
let refUrl;
if (/^https?:\/\//.test(REF)) {
  refUrl = REF;
} else {
  const buf = await fs.readFile(path.isAbsolute(REF) ? REF : path.join(root, REF));
  refUrl = await fal.storage.upload(new File([new Blob([buf])], "ref.jpg", { type: "image/jpeg" }));
}
console.log("Reference:", REF, "->", refUrl, "\nScene:", SCENE, "\n");

const IDENTITY =
  "the exact same child from the reference photo, faithfully preserving their face shape, " +
  "eye colour and shape, eyebrows, nose, mouth, skin tone and hairstyle so the character " +
  "stays clearly recognisable as this specific child";
const STYLE = "soft Pixar-Disney style 3D animated storybook illustration, cinematic warm lighting, highly detailed";

const models = [
  {
    label: "flux2", endpoint: "fal-ai/flux-2-pro/edit",
    input: {
      prompt: `A ${STYLE} of ${IDENTITY}. Scene: ${SCENE}.`,
      image_urls: [refUrl],
      image_size: { width: 1024, height: 1024 },
    },
  },
  {
    label: "nano", endpoint: "fal-ai/nano-banana-pro/edit",
    input: {
      prompt: `Create a ${STYLE} of ${IDENTITY}. Scene: ${SCENE}.`,
      image_urls: [refUrl],
      aspect_ratio: "1:1",
      num_images: 1,
      output_format: "jpeg",
    },
  },
  {
    label: "pulid", endpoint: "fal-ai/flux-pulid",
    input: {
      reference_image_url: refUrl,
      prompt: `A Pixar-Disney 3D animated storybook illustration of a child, ${SCENE}. ${STYLE}`,
      negative_prompt: NEGATIVE_PROMPT,
      num_inference_steps: 25, guidance_scale: 4.0, true_cfg: 1, id_weight: 0.9,
      num_images: 1, image_size: "square_hd",
    },
  },
];

async function run(m) {
  const t = Date.now();
  try {
    const r = await fal.subscribe(m.endpoint, { input: m.input });
    const url = r.data.images[0].url;
    const img = Buffer.from(await (await fetch(url)).arrayBuffer());
    await fs.mkdir(path.join(root, "compare"), { recursive: true });
    await fs.writeFile(path.join(root, `compare/${m.label}.jpg`), img);
    return { label: m.label, secs: ((Date.now() - t) / 1000).toFixed(1), url };
  } catch (e) {
    return { label: m.label, error: e.message, secs: ((Date.now() - t) / 1000).toFixed(1) };
  }
}

const results = await Promise.all(models.map(run));
results.forEach(r => console.log(r));
console.log("\nSaved to compare/flux2.jpg, compare/nano.jpg, compare/pulid.jpg");
