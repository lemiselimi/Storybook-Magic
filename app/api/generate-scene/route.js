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
    const { loraUrl, referenceImageUrl, prompt, seed, webhookUrl } = await request.json();

    if (!prompt) return Response.json({ error: "prompt required" }, { status: 400 });

    // ── PuLID path (no per-child training) ───────────────────────────────────
    // Used when a reference photo URL is supplied. Identity is injected at
    // inference time, so scenes start in seconds instead of waiting 3-5 min for
    // a trained LoRA. id_weight 0.7 was chosen via the likeness test.
    if (referenceImageUrl) {
      // Prompts are authored around the LoRA trigger "a photo of TOK," — that
      // token is meaningless to PuLID and "a photo of" pushes toward realism,
      // so swap it for an explicit stylized-illustration lead-in.
      const pulidPrompt = prompt.replace(
        /a photo of TOK,/gi,
        "A Pixar-Disney 3D animated storybook illustration of a child,"
      );
      console.log("Submitting PuLID scene job:", pulidPrompt.substring(0, 80));

      const { request_id } = await fal.queue.submit("fal-ai/flux-pulid", {
        input: {
          reference_image_url: referenceImageUrl,
          prompt: pulidPrompt,
          negative_prompt: NEGATIVE_PROMPT,
          num_inference_steps: 25,
          guidance_scale: 4.0,
          true_cfg: 1,
          id_weight: 0.7,
          num_images: 1,
          image_size: "square_hd",
          ...(seed != null ? { seed } : {}),
        },
        ...(webhookUrl ? { webhookUrl } : {}),
      });

      console.log("PuLID scene job submitted, request_id:", request_id);
      return Response.json({ jobId: request_id, model: "pulid" });
    }

    // ── Legacy LoRA path (dormant fallback) ──────────────────────────────────
    if (!loraUrl) return Response.json({ error: "loraUrl or referenceImageUrl required" }, { status: 400 });

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
    return Response.json({ jobId: request_id, model: "lora" });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message, failed: true }, { status: 500 });
  }
}
