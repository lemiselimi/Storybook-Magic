import { fal } from "@fal-ai/client";

export const maxDuration = 90; // 3 parallel Kontext calls ~30s + zip/upload ~10s + job submit ~5s

const VARIATION_PROMPTS = [
  "Keep exact face and likeness. Front facing portrait, neutral expression, plain white background, soft studio lighting. Face clearly visible.",
  "Keep exact face and likeness. Slight 3/4 angle portrait, neutral expression, plain background, natural lighting. Face clearly visible.",
  "Keep exact face and likeness. Slight side angle, neutral expression, plain background, soft lighting. Face clearly visible.",
];

async function generateVariation(prompt, imageUrl) {
  const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
    input: {
      prompt,
      image_url: imageUrl,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      output_format: "jpeg",
      image_size: "portrait_4_3",
    },
  });
  return result.data.images[0].url;
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) return Response.json({ error: "imageUrl required" }, { status: 400 });

    console.log("Generating 3 face variations via Kontext...");

    // Generate 3 angle variations in parallel
    const variationUrls = await Promise.all(
      VARIATION_PROMPTS.map(prompt => generateVariation(prompt, imageUrl))
    );
    console.log("Variations generated:", variationUrls.length);

    // Download all 3 variation images
    const imageBuffers = await Promise.all(
      variationUrls.map(async (url, i) => {
        const res = await fetch(url);
        const buf = Buffer.from(await res.arrayBuffer());
        return { buf, name: `face_variation_${i + 1}.jpg` };
      })
    );

    // Build ZIP archive
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    imageBuffers.forEach(({ buf, name }) => zip.file(name, buf));
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Upload ZIP to fal storage
    const zipBlob = new Blob([zipBuffer], { type: "application/zip" });
    const zipFile = new File([zipBlob], "training_images.zip", { type: "application/zip" });
    console.log("Uploading training ZIP to fal storage...");
    const zipUrl = await fal.storage.upload(zipFile);
    console.log("ZIP uploaded:", zipUrl);

    // Submit LoRA training job (non-blocking — returns immediately with jobId)
    console.log("Submitting LoRA training job...");
    const { request_id } = await fal.queue.submit("fal-ai/flux-lora-fast-training", {
      input: {
        images_data_url: zipUrl,
        trigger_word: "TOK",
        steps: 500,
        rank: 16,
        learning_rate: 0.0004,
        multiresolution_training: true,
      },
    });

    console.log("LoRA job submitted, request_id:", request_id);
    return Response.json({ jobId: request_id, status: "IN_QUEUE" });
  } catch (err) {
    console.error("Train LoRA error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
