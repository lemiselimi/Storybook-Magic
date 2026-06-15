import { fal } from "@fal-ai/client";

// Identity-injection consistency test: no per-child LoRA training.
// Runs the SAME reference photo + scenes through two no-training models so we
// can compare likeness AND speed side by side, then pick one to replace the
// ~3-5 min trained-LoRA path that gates the production preview.
//   - flux-pro/kontext : edits the reference image (image-to-image)
//   - flux-pulid       : injects the face into a freshly-composed scene (id_weight knob)
export const maxDuration = 180;

const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 100, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Mirrors the production STYLE_TOKEN / SAFETY so this is apples-to-apples
// against the trained-LoRA scenes, not a different aesthetic.
const STYLE =
  "Pixar-Disney 3D animated film frame, stylized expressive character design, warm golden-hour painted light, " +
  "wide environmental shot with the child shown waist-to-head filling no more than 40% of the frame, " +
  "rich three-layer background filling the rest, fully warm harmonized palette (amber, honey, soft orange).";
const SAFETY =
  "The child is fully clothed in an age-appropriate adventure outfit (long sleeves, full-length trousers, shoes). " +
  "Background contains only nature, animals, and magical storybook elements. Safe for young children. No text, no logos.";
const IDENTITY =
  "Keep this exact child's face shape, facial features, hairstyle, hair colour, skin tone, and eye colour " +
  "perfectly consistent and instantly recognisable as the same child.";
const NEGATIVE =
  "different person, wrong face, altered face, different child, generic face, realistic photo, blurry, " +
  "low quality, adult, teenager, deformed, text, watermark, multiple people";

const SCENES = [
  "stepping through a glowing hidden doorway into a magical forest at golden hour, fireflies swirling all around",
  "crossing a crumbling rope bridge over a misty canyon, giant colourful mushrooms towering in the background",
  "standing triumphant on a hilltop at sunset, arms raised, friendly woodland creatures cheering around them",
];

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) return Response.json({ error: "Too many requests. Try again later." }, { status: 429 });

  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const body = await request.json();
    const { imageUrl } = body;
    // Likeness lever for PuLID: valid range is 0-1.0 (the model rejects >1, returning 0 images).
    const rawIdWeight = typeof body.idWeight === "number" ? body.idWeight : 1.0;
    const idWeight = Math.max(0, Math.min(1, rawIdWeight));
    if (!imageUrl) return Response.json({ error: "imageUrl required" }, { status: 400 });

    console.log("Identity test: 3 scenes x2 models from", imageUrl.substring(0, 80), "idWeight", idWeight);

    const runKontext = async (scene) => {
      const startedAt = Date.now();
      const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
        input: {
          image_url: imageUrl,
          prompt: `Restyle this photo into a children's storybook illustration of the same child: ${scene}. ${IDENTITY} ${STYLE} ${SAFETY}`,
          guidance_scale: 2.5,
          num_images: 1,
          safety_tolerance: "2",
          output_format: "jpeg",
          aspect_ratio: "1:1",
        },
      });
      return { scene, url: result.data?.images?.[0]?.url ?? null, tookMs: Date.now() - startedAt };
    };

    const runPulid = async (scene) => {
      const startedAt = Date.now();
      const result = await fal.subscribe("fal-ai/flux-pulid", {
        input: {
          reference_image_url: imageUrl,
          prompt: `A child ${scene}. ${IDENTITY} ${STYLE} ${SAFETY}`,
          negative_prompt: NEGATIVE,
          num_inference_steps: 25,
          guidance_scale: 4.0,
          true_cfg: 1,
          id_weight: idWeight,
          num_images: 1,
          image_size: "square_hd",
        },
      });
      return { scene, url: result.data?.images?.[0]?.url ?? null, tookMs: Date.now() - startedAt };
    };

    const settle = (settled) =>
      settled.map((s, i) =>
        s.status === "fulfilled" ? s.value : { scene: SCENES[i], url: null, tookMs: null, error: s.reason?.message ?? "failed" }
      );

    // Both models, all scenes, fully parallel — wall-clock ≈ one slow generation.
    const wallStart = Date.now();
    const [kSettled, pSettled] = await Promise.all([
      Promise.allSettled(SCENES.map(runKontext)),
      Promise.allSettled(SCENES.map(runPulid)),
    ]);
    const wallMs = Date.now() - wallStart;

    const kontext = settle(kSettled);
    const pulid   = settle(pSettled);
    console.log(`Identity test done in ${wallMs}ms — kontext ${kontext.filter(r => r.url).length}/3, pulid ${pulid.filter(r => r.url).length}/3`);

    return Response.json({
      kontext: { model: "fal-ai/flux-pro/kontext", results: kontext },
      pulid:   { model: "fal-ai/flux-pulid", idWeight, results: pulid },
      meta: { wallMs, total: 3 },
    });
  } catch (err) {
    console.error("Identity test error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
