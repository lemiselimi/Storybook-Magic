import { fal } from "@fal-ai/client";

export const maxDuration = 60;

async function callLoRA(prompt, loraUrl) {
  const result = await fal.subscribe("fal-ai/flux-lora", {
    input: {
      prompt,
      loras: [{ path: loraUrl, scale: 1.0 }],
      num_inference_steps: 28,
      guidance_scale: 3.5,
      image_size: "landscape_4_3",
      enable_safety_checker: true,
    },
  });
  return result.data.images[0].url;
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { loraUrl, prompt } = await request.json();

    if (!loraUrl) return Response.json({ error: "loraUrl required" }, { status: 400 });
    if (!prompt)  return Response.json({ error: "prompt required" },   { status: 400 });

    console.log("Generate scene (LoRA):", prompt.substring(0, 80));

    let url;
    try {
      url = await callLoRA(prompt, loraUrl);
    } catch (firstErr) {
      console.warn("LoRA attempt 1 failed:", firstErr.message, "— retrying");
      try {
        url = await callLoRA(prompt, loraUrl);
      } catch (retryErr) {
        console.error("LoRA retry failed:", retryErr.message);
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
