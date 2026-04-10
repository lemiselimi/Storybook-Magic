import { fal } from "@fal-ai/client";

export const maxDuration = 60;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { loraUrl, illustration, childName, gender, childAge, hairColor, eyeColor, isCover } = await request.json();

    if (!loraUrl) return Response.json({ error: "loraUrl required" }, { status: 400 });

    console.log("Generate scene called:", illustration?.substring(0, 80));

    const genderWord = gender === "girl" ? "girl" : gender === "boy" ? "boy" : "child";

    const ageNum = Number(childAge) || 5;
    let ageDesc;
    if      (ageNum <= 2)  ageDesc = "toddler aged 1-2, tiny, chubby cheeks, very small stature";
    else if (ageNum <= 4)  ageDesc = "preschooler aged 3-4, small child, round face";
    else if (ageNum <= 7)  ageDesc = "young child aged 5-7, small and cute";
    else if (ageNum <= 10) ageDesc = "child aged 8-10";
    else                   ageDesc = "preteen aged 11-12, taller child";

    const hairDesc = hairColor ? `${hairColor.replace(/-/g, " ")} hair` : "";
    const eyeDesc  = eyeColor  ? `${eyeColor.replace(/-/g, " ")} eyes`  : "";
    const appearance = [hairDesc, eyeDesc].filter(Boolean).join(", ");

    const characterDesc = `${childName || "the child"}, a ${ageDesc} ${genderWord}${appearance ? ` with ${appearance}` : ""}`;

    const genderDirective = gender === "boy"
      ? "The child is a boy. All characters, creatures, and companions in the scene must also be clearly masculine or gender-neutral in design. No feminine colors such as pink bows or purple ribbons, no feminine creatures, no princess or fairy aesthetics."
      : gender === "girl"
      ? "The child is a girl. Scenes can include feminine elements if appropriate to the theme."
      : "";

    const styleAnchor = "Cinematic 3D-style illustration, warm volumetric lighting, photorealistic child, consistent art style across all scenes, soft depth of field, storybook atmosphere";

    const safetyDirectives = "The child must be fully clothed at all times, wearing age-appropriate adventure clothing suited to the story theme. No bare chest, no shirtless scenes. Background must contain only animals, nature, and magical storybook elements. No real human crowds, no realistic background people, no real-world urban settings.";

    const prompt = `a photo of TOK, ${characterDesc}, ${illustration}, ${styleAnchor}, vibrant colors, whimsical and joyful. ${safetyDirectives}${genderDirective ? `. ${genderDirective}` : ""}`;

    const result = await fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt,
        negative_prompt: "realistic photo, dark, scary, blurry, low quality, adult, teenager, text, words, letters, numbers, signs, labels, speech bubbles, thought bubbles, written characters, watermark, deformed, ugly, multiple people, violence, wrong age, nude, shirtless, bare chest, crowd, real people, urban background",
        loras: [{ path: loraUrl, scale: 1.0 }],
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        image_size: isCover ? "portrait_4_3" : "landscape_4_3",
        enable_safety_checker: true,
      },
    });

    console.log("Scene result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({ url: result.data.images[0].url });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
