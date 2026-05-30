import { fal } from "@fal-ai/client";
import { NEGATIVE_PROMPT } from "../_lib/fal.js";

export const maxDuration = 30;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { loraUrl, prompt, seed, webhookUrl } = await request.json();

    if (!loraUrl) return Response.json({ error: "loraUrl required" }, { status: 400 });
    if (!prompt)  return Response.json({ error: "prompt required" },   { status: 400 });

    console.log("Submitting scene job:", prompt.substring(0, 80));

    const { request_id } = await fal.queue.submit("fal-ai/flux-lora", {
      input: {
        prompt,
        negative_prompt: NEGATIVE_PROMPT,
        loras: [{ path: loraUrl, scale: 1.0 }],
        num_inference_steps: 28,
        guidance_scale: 6.0,
        image_size: "square_hd",
        enable_safety_checker: true,
        ...(seed != null ? { seed } : {}),
      },
      ...(webhookUrl ? { webhookUrl } : {}),
    });

    console.log("Scene job submitted, request_id:", request_id);
    return Response.json({ jobId: request_id });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message, failed: true }, { status: 500 });
  }
}
