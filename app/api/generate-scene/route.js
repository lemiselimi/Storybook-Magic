import { fal } from "@fal-ai/client";

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { photoUrl, illustration, childName, gender, childAge, hairColor, eyeColor } = await request.json();
    console.log("Generate scene called:", illustration?.substring(0, 80));

    const genderWord = gender === "girl" ? "girl" : gender === "boy" ? "boy" : "child";

    // Age-accurate descriptor so the model renders the right body size/proportions
    const ageNum = Number(childAge) || 5;
    let ageDesc;
    if      (ageNum <= 2)  ageDesc = "toddler aged 1-2, tiny, chubby cheeks, very small stature, short pudgy legs";
    else if (ageNum <= 4)  ageDesc = "preschooler aged 3-4, small child, round face, small body";
    else if (ageNum <= 7)  ageDesc = "young child aged 5-7, small and cute";
    else if (ageNum <= 10) ageDesc = "child aged 8-10";
    else                   ageDesc = "preteen aged 11-12, taller child";

    const hairDesc = hairColor ? `${hairColor.replace(/-/g, " ")} hair` : "";
    const eyeDesc  = eyeColor  ? `${eyeColor.replace(/-/g, " ")} eyes`  : "";
    const appearance = [hairDesc, eyeDesc].filter(Boolean).join(", ");

    const characterDesc = `${childName || "the child"}, a ${ageDesc} ${genderWord}${appearance ? ` with ${appearance}` : ""},`;

    const result = await fal.subscribe("fal-ai/flux-pulid", {
      input: {
        reference_image_url: photoUrl,
        prompt: `Pixar Disney 3D animated children's book illustration, ${illustration}, ${characterDesc} as the main character in this scene, vibrant colors, cinematic soft lighting, magical storybook atmosphere, highly detailed CGI render, professional Pixar animation style, wide establishing shot, whimsical and joyful`,
        negative_prompt: "realistic, photorealistic, dark, scary, blurry, low quality, adult, teenager, text, watermark, logo, deformed, ugly, multiple people, violence, wrong age",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        true_cfg: 1,
        id_weight: 0.4,
        num_images: 1,
        image_size: "landscape_4_3",
      },
    });

    console.log("Scene result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({ url: result.data.images[0].url });
  } catch (err) {
    console.error("Generate scene error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
