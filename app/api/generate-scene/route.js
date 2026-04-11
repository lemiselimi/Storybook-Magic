import { fal } from "@fal-ai/client";

export const maxDuration = 60;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { imageUrl, illustration, childName, gender, childAge, hairColor, eyeColor, isCover } = await request.json();

    if (!imageUrl) return Response.json({ error: "imageUrl required" }, { status: 400 });

    console.log("Generate scene (Kontext) called:", illustration?.substring(0, 80));

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

    const safetyDirectives = "The child must be fully clothed at all times, wearing age-appropriate adventure clothing suited to the story theme. No bare chest, no shirtless scenes. Background must contain only animals, nature, and magical storybook elements. No real human crowds, no realistic background people, no real-world urban settings.";

    const prompt = (
      `Transform this photo into a cinematic 3D-style children's book illustration. ` +
      `Keep the child's exact face, features and likeness. ` +
      `The child is ${characterDesc}. ` +
      `Scene: ${illustration}. ` +
      `Style: warm volumetric lighting, soft depth of field, magical storybook atmosphere, Pixar-inspired 3D render quality. ` +
      `${safetyDirectives}` +
      (genderDirective ? ` ${genderDirective}` : "") +
      ` No text, no words, no letters anywhere in the image.`
    );

    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt,
        image_url: imageUrl,
        image_size: isCover ? "portrait_4_3" : "landscape_4_3",
      },
    });

    console.log("Scene result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({ url: result.data.images[0].url });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
