import { fal } from "@fal-ai/client";

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { imageBase64, illustration } = await request.json();
    console.log("Cartoonify called, illustration:", illustration?.substring(0, 50));

    const result = await fal.subscribe("fal-ai/flux-pulid", {
      input: {
        reference_images: [{ image_url: "data:image/jpeg;base64," + imageBase64 }],
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