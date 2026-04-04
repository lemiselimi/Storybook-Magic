import { fal } from "@fal-ai/client";

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { imageBase64, illustration } = await request.json();
    console.log("Cartoonify called");

    // Convert base64 to blob and upload to fal storage
    const byteChars = atob(imageBase64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: "image/jpeg" });
    const imageUrl = await fal.storage.upload(blob);
    console.log("Uploaded to fal storage:", imageUrl);

    const result = await fal.subscribe("fal-ai/flux-pulid", {
      input: {
        reference_images: [{ image_url: imageUrl }],
        prompt: `Pixar Disney 3D animated children's book illustration, ${illustration}, vibrant colors, cinematic lighting, magical atmosphere, highly detailed, professional render, cheerful and whimsical`,
        negative_prompt: "realistic, dark, scary, blurry, low quality, adult, text, watermark",
        num_inference_steps: 20,
        guidance_scale: 4,
        true_cfg: 1,
        id_weight: 1.0,
        num_images: 1,
      },
    });

    console.log("Result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({ url: result.data.images[0].url });
  } catch (err) {
    console.error("Cartoonify error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}