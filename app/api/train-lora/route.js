import { fal } from "@fal-ai/client";

export const maxDuration = 300; // 5 minutes — LoRA training takes ~2–3 min

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { photosBase64 } = await request.json();

    if (!photosBase64 || photosBase64.length < 1) {
      return Response.json({ error: "At least 1 photo required" }, { status: 400 });
    }

    console.log(`LoRA training: ${photosBase64.length} photos received`);

    // Build a ZIP archive of all training images
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    photosBase64.forEach((b64, i) => {
      zip.file(`image_${i + 1}.jpg`, Buffer.from(b64, "base64"));
    });
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Upload ZIP to fal storage
    const zipBlob = new Blob([zipBuffer], { type: "application/zip" });
    const zipFile = new File([zipBlob], "training_images.zip", { type: "application/zip" });
    console.log("Uploading ZIP to fal storage...");
    const zipUrl = await fal.storage.upload(zipFile);
    console.log("ZIP uploaded:", zipUrl);

    // Train LoRA
    console.log("Starting LoRA training...");
    const result = await fal.subscribe("fal-ai/flux-lora-fast-training", {
      input: {
        images_data_url: zipUrl,
        trigger_word: "TOK",
        steps: 500,
        rank: 16,
        learning_rate: 0.0004,
        multiresolution_training: true,
      },
      logs: true,
      onQueueUpdate: (update) => {
        const lastLog = update.logs?.slice(-1)?.[0]?.message;
        console.log("LoRA training:", update.status, lastLog ?? "");
      },
    });

    const loraUrl = result.data.diffusers_lora_file?.url;
    console.log("LoRA training complete:", loraUrl);
    return Response.json({ url: loraUrl });
  } catch (err) {
    console.error("LoRA training error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
