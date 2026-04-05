import { fal } from "@fal-ai/client";

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { imageBase64, gender } = await request.json();
    console.log("Cartoonify called, gender:", gender);

    // Convert base64 to blob and upload to fal storage
    const byteChars = atob(imageBase64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: "image/jpeg" });
    const photoUrl = await fal.storage.upload(blob);
    console.log("Uploaded to fal storage:", photoUrl);

    // Generate a clean Pixar-style character avatar portrait
    const result = await fal.subscribe("fal-ai/flux-pulid", {
      input: {
        reference_image_url: photoUrl,
        prompt: `Pixar Disney 3D animated character, adorable ${gender === "girl" ? "girl" : gender === "boy" ? "boy" : "child"} hero, full body portrait, expressive large eyes, warm friendly smile, colorful storybook outfit, soft pastel gradient background, studio lighting, highly detailed CGI render, professional Pixar animation style, vibrant colors, cute and charming, facing camera`,
        negative_prompt: "realistic, photorealistic, dark, scary, blurry, low quality, adult, text, watermark, logo, deformed, ugly, multiple people, busy background, cluttered",
        num_inference_steps: 30,
        guidance_scale: 3.5,
        true_cfg: 1,
        id_weight: 0.75,
        num_images: 1,
        image_size: "portrait_4_3",
      },
    });

    console.log("Avatar result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({
      url: result.data.images[0].url, // Pixar avatar URL
      photoUrl,                        // original uploaded photo URL (fal storage) for scene generation
    });
  } catch (err) {
    console.error("Cartoonify error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
