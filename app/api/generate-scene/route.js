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

    // ── Reference-photo identity path (no per-child training) ────────────────
    // Identity is read from the uploaded photo at inference time.
    if (referenceImageUrl) {
      // Engine selection (override in the environment, no redeploy needed):
      //   nano  (default) — Nano Banana Pro edit; best child likeness (bake-off winner)
      //   flux2           — FLUX.2 [pro] edit; richer scenes, weaker face
      //   pulid           — legacy FLUX.1 PuLID pipeline (kept intact below)
      const IMAGE_MODEL = (process.env.IMAGE_MODEL || "nano").toLowerCase();

      if (IMAGE_MODEL !== "pulid") {
        // Scene prompts are authored around the LoRA trigger "a photo of TOK,".
        // Swap it for an instruction that ties the scene to the uploaded child
        // and holds the stylized-illustration look.
        const IDENTITY_LEAD =
          "A soft Pixar-Disney style 3D animated storybook illustration of the exact same child from the reference photo, faithfully preserving their face shape, eye colour and shape, eyebrows, nose, mouth, skin tone and hairstyle so the character stays clearly recognisable as this specific child while rendered in the animated style,";
        const identityPrompt = /a photo of TOK,/i.test(prompt)
          ? prompt.replace(/a photo of TOK,/gi, IDENTITY_LEAD)
          : `${IDENTITY_LEAD} ${prompt}`;

        if (IMAGE_MODEL === "flux2") {
          console.log("Submitting FLUX.2 scene job:", identityPrompt.substring(0, 80));
          const { request_id } = await fal.queue.submit("fal-ai/flux-2-pro/edit", {
            input: {
              prompt: identityPrompt,
              image_urls: [referenceImageUrl],
              image_size: { width: 1024, height: 1024 },
              ...(seed != null ? { seed } : {}),
            },
            ...(webhookUrl ? { webhookUrl } : {}),
          });
          console.log("FLUX.2 scene job submitted, request_id:", request_id);
          return Response.json({ jobId: request_id, model: "flux2" });
        }

        // Default: Nano Banana Pro edit — strongest face likeness.
        console.log("Submitting Nano Banana scene job:", identityPrompt.substring(0, 80));
        const { request_id } = await fal.queue.submit("fal-ai/nano-banana-pro/edit", {
          input: {
            prompt: identityPrompt,
            image_urls: [referenceImageUrl],
            aspect_ratio: "1:1",
            num_images: 1,
            output_format: "jpeg",
          },
          ...(webhookUrl ? { webhookUrl } : {}),
        });
        console.log("Nano Banana scene job submitted, request_id:", request_id);
        return Response.json({ jobId: request_id, model: "nano" });
      }

      // ── PuLID fallback (active when IMAGE_MODEL=pulid) ────────────────────────
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
