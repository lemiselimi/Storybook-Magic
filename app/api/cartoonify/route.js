import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();
    const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
      input: {
        image_url: "data:image/jpeg;base64," + imageBase64,
        prompt: "Pixar Disney 3D animated movie character portrait of a child, highly detailed, cinematic lighting, vibrant colors, big expressive eyes, soft rounded features, professional 3D render, cheerful and friendly expression, clean background",
        negative_prompt: "realistic, photograph, dark, scary, adult, blurry, low quality",
        strength: 0.75,
        num_inference_steps: 28,
        guidance_scale: 7.5,
        num_images: 1,
      },
    });
    return Response.json({ url: result.data.images[0].url });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}