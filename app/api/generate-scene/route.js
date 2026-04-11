import { fal } from "@fal-ai/client";

export const maxDuration = 60;

async function callKontext(prompt, imageUrl) {
  const result = await fal.subscribe("fal-ai/flux-pro/kontext/max", {
    input: { prompt, image_url: imageUrl },
  });
  return result.data.images[0].url;
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { imageUrl, prompt } = await request.json();

    if (!imageUrl) return Response.json({ error: "imageUrl required" }, { status: 400 });
    if (!prompt)   return Response.json({ error: "prompt required" },   { status: 400 });

    console.log("Generate scene (Kontext):", prompt.substring(0, 80));

    let url;
    try {
      url = await callKontext(prompt, imageUrl);
    } catch (firstErr) {
      console.warn("Kontext attempt 1 failed:", firstErr.message, "— retrying");
      try {
        url = await callKontext(prompt, imageUrl);
      } catch (retryErr) {
        console.error("Kontext retry failed:", retryErr.message);
        return Response.json({ error: retryErr.message, failed: true }, { status: 500 });
      }
    }

    console.log("Scene generated:", url?.substring(0, 80));
    return Response.json({ url });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message, failed: true }, { status: 500 });
  }
}
