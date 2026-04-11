import { fal } from "@fal-ai/client";

export const maxDuration = 60;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { imageUrl, prompt } = await request.json();

    if (!imageUrl) return Response.json({ error: "imageUrl required" }, { status: 400 });
    if (!prompt)   return Response.json({ error: "prompt required" },   { status: 400 });

    console.log("Generate scene (Kontext):", prompt.substring(0, 80));

    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: { prompt, image_url: imageUrl },
    });

    console.log("Scene result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({ url: result.data.images[0].url });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
