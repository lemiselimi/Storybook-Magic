import { fal } from "@fal-ai/client";
import { NEGATIVE_PROMPT } from "../_lib/fal.js";

export const maxDuration = 30;

const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 30, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) return Response.json({ error: "Too many requests. Try again later." }, { status: 429 });

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
        num_inference_steps: 20,
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
