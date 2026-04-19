import { fal } from "@fal-ai/client";

export const maxDuration = 60; // Just zip + upload + submit — no AI calls

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { photosBase64 } = await request.json();

    if (!photosBase64 || photosBase64.length < 1) {
      return Response.json({ error: "At least 1 photo required" }, { status: 400 });
    }
    if (photosBase64.length > 2) {
      return Response.json({ error: "Maximum 2 photos allowed" }, { status: 400 });
    }

    console.log(`LoRA training: ${photosBase64.length} photo(s) received`);

    // Build ZIP archive from raw uploaded photos
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

    // Submit LoRA training job (fire and return — polling via check-lora)
    console.log("Submitting LoRA training job...");
    const { request_id } = await fal.queue.submit("fal-ai/flux-lora-fast-training", {
      input: {
        images_data_url: zipUrl,
        trigger_word: "TOK",
        steps: 300,
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
