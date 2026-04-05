import { fal } from "@fal-ai/client";

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { photoUrl, illustration, childName, gender } = await request.json();
    console.log("Generate scene called:", illustration?.substring(0, 80));

    const genderWord = gender === "girl" ? "girl" : gender === "boy" ? "boy" : "child";
    const characterDesc = childName ? `${childName}, a young ${genderWord},` : `a young ${genderWord},`;

    const result = await fal.subscribe("fal-ai/flux-pulid", {
      input: {
        reference_image_url: photoUrl,
        prompt: `Pixar Disney 3D animated children's book illustration, ${illustration}, ${characterDesc} as the main character in this scene, vibrant colors, cinematic soft lighting, magical storybook atmosphere, highly detailed CGI render, professional Pixar animation style, wide establishing shot, whimsical and joyful`,
        negative_prompt: "realistic, photorealistic, dark, scary, blurry, low quality, adult, text, watermark, logo, deformed, ugly, multiple adult people, violence",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        true_cfg: 1,
        id_weight: 1.0,
        num_images: 1,
        image_size: "landscape_4_3",
      },
    });

    console.log("Scene result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({ url: result.data.images[0].url });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
