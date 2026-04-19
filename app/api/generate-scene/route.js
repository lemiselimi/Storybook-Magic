import { fal } from "@fal-ai/client";

export const maxDuration = 60;

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
  // Style rejects
  "plastic skin, airbrushed skin, waxy skin, oversmoothed skin, porcelain skin, doll-like, " +
  "3D animated, CGI render, Pixar style, cartoon, 2D, flat cartoon, anime, sketch, " +
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

async function callLoRA(prompt, loraUrl, seed) {
  const result = await fal.subscribe("fal-ai/flux-lora", {
    input: {
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      loras: [{ path: loraUrl, scale: 1.0 }],
      num_inference_steps: 32,
      guidance_scale: 6.0,
      image_size: "landscape_4_3",
      enable_safety_checker: true,
      ...(seed != null ? { seed } : {}),
    },
  });
  return result.data.images[0].url;
}

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { loraUrl, prompt, seed } = await request.json();

    if (!loraUrl) return Response.json({ error: "loraUrl required" }, { status: 400 });
    if (!prompt)  return Response.json({ error: "prompt required" },   { status: 400 });

    console.log("Generate scene (LoRA):", prompt.substring(0, 80), seed != null ? `seed=${seed}` : "");

    let url;
    try {
      url = await callLoRA(prompt, loraUrl, seed);
    } catch (firstErr) {
      console.warn("LoRA attempt 1 failed:", firstErr.message, "— retrying");
      try {
        url = await callLoRA(prompt, loraUrl, seed);
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
