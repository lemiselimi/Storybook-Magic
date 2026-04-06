import { fal } from "@fal-ai/client";

export const maxDuration = 60;

fal.config({ credentials: process.env.FAL_API_KEY });

export async function POST(request) {
  try {
    const { imageBase64, gender, hairColor, eyeColor, childAge } = await request.json();
    console.log("Cartoonify called, gender:", gender, "hair:", hairColor, "eyes:", eyeColor, "age:", childAge);

    const genderWord = gender === "girl" ? "girl" : gender === "boy" ? "boy" : "child";

    const ageNum = Number(childAge) || 5;
    let ageDesc;
    if      (ageNum <= 2)  ageDesc = "toddler aged 1-2, chubby baby face, tiny body, pudgy cheeks";
    else if (ageNum <= 4)  ageDesc = "preschooler aged 3-4, small round face, small body";
    else if (ageNum <= 7)  ageDesc = "young child aged 5-7, cute small face";
    else if (ageNum <= 10) ageDesc = "child aged 8-10";
    else                   ageDesc = "preteen aged 11-12, taller child";

    const hairDesc   = hairColor ? `${hairColor.replace(/-/g, " ")} hair` : "";
    const eyeDesc    = eyeColor  ? `${eyeColor.replace(/-/g, " ")} eyes`  : "";
    const appearance = [hairDesc, eyeDesc].filter(Boolean).join(", ");

    // Convert base64 to blob and upload to fal storage
    const byteChars = atob(imageBase64);
    const byteArr = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteArr], { type: "image/jpeg" });
    const photoUrl = await fal.storage.upload(blob);
    console.log("Uploaded to fal storage:", photoUrl);

    // Generate a cinematic 3D animated character portrait
    const result = await fal.subscribe("fal-ai/flux-pulid", {
      input: {
        reference_image_url: photoUrl,
        prompt: `${childName || "the child"}, ${ageDesc} ${genderWord}${appearance ? ` with ${appearance}` : ""}, facing camera, warm friendly smile, cinematic 3D animated storybook portrait, colorful storybook outfit, soft studio lighting, clean pastel gradient background, high-quality CGI render`,
        negative_prompt: "different person, wrong face, altered face, realistic photo, dark, scary, blurry, low quality, adult, teenager, wrong age, text, watermark, deformed, ugly, multiple people, sunglasses",
        num_inference_steps: 32,
        guidance_scale: 3.0,
        true_cfg: 1.5,
        id_weight: 0.85,
        num_images: 1,
        image_size: "portrait_4_3",
      },
    });

    console.log("Avatar result:", JSON.stringify(result.data).substring(0, 200));
    return Response.json({
      url: result.data.images[0].url, // 3D animated avatar URL
      photoUrl,                        // original uploaded photo URL (fal storage) for scene generation
    });
  } catch (err) {
    console.error("Cartoonify error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
