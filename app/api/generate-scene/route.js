import { fal } from "@fal-ai/client";

export const maxDuration = 30; // Just submit — returns immediately

const NEGATIVE_PROMPT =
  // Composition rejects
  "portrait, close-up, extreme close-up, face close-up, head shot, bust shot, face filling frame, " +
  "character larger than 50% of frame, zoomed in, tight framing, cropped background, " +
  "character with no environment, character against blurred background only, " +
  "passport photo, school photo, studio portrait, character floating in space, " +
  "centered portrait, flat background, empty background, plain background, minimal background, " +
  // Lighting rejects
  "flat lighting, front lighting, studio lighting, overcast, grey sky, cool tones, blue tones, cold light, " +
  // Pose rejects
  "standing still, stiff pose, static, symmetrical, arms at sides, neutral expression, rigid, formal pose, " +
  "lifeless, boring composition, stock photo pose, " +
  // Lighting rejects (extended)
  "blue portal glow, cool blue light source, cold blue tinted scene, blue toned lighting, blue wash, " +
  "purple tinted scene, cold magical light, icy glow, moonlit blue cast, " +
  // Style rejects — photorealism forbidden, Pixar animation is the target
  "photorealistic, photography, DSLR, photo, realistic skin texture, realistic skin pores, " +
  "hyper-realistic, live action, real human, cinematic photography, " +
  "waxy skin, porcelain skin, plastic skin, oversmoothed skin, " +
  "2D, flat cartoon, anime, manga, sketch, " +
  // Pose rejects (extended)
  "side profile face, full profile, facing away, back to camera, " +
  // Safety rejects
  "text, watermark, words, letters, logos, branded clothing, " +
  "nudity, nude, naked, topless, bare chest, shirtless, no shirt, bare torso, exposed chest, " +
  "bare shoulders, exposed midriff, sleeveless, tank top, crop top, swimsuit, swimwear, bikini, " +
  "underwear, short shorts, revealing clothing, bare skin on torso, bare arms, bare legs, " +
  "adult, teenager, mature, sexy, suggestive, " +
  "ugly, deformed, blurry, low quality, " +
  "multiple people, crowd, real people in background, urban background, scary, dark, violent";

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { loraUrl, prompt, seed } = await request.json();

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
    });

    console.log("Scene job submitted, request_id:", request_id);
    return Response.json({ jobId: request_id });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message, failed: true }, { status: 500 });
  }
}
