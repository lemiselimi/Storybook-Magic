import { fal } from "@fal-ai/client";

export const maxDuration = 300;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { imageBase64, illustration } = await request.json();

    const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
      input: {
        image_url: "data:image/jpeg;base64," + imageBase64,
        prompt: `Pixar Disney 3D animated movie style children's book illustration. The main character is a child with Pixar-style features: big expressive eyes, soft rounded features, vibrant colors. Scene: ${illustration}. Professional 3D render, cinematic lighting, cheerful and magical atmosphere, children's book style.`,
        negative_prompt: "realistic, photograph, dark, scary, adult, blurry, low quality, text",
        strength: 0.7,
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