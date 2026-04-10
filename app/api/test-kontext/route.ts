import { fal } from "@fal-ai/client";

export const maxDuration = 60;

export async function POST(request: Request) {
  fal.config({ credentials: process.env.FAL_API_KEY });

  const body = await request.json();
  const { photoUrl, photoBase64, prompt } = body as {
    photoUrl?: string;
    photoBase64?: string;
    prompt: string;
  };

  let imageUrl = photoUrl;

  if (!imageUrl && photoBase64) {
    // Convert base64 to blob and upload to fal storage
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const file = new File([blob], "reference.jpg", { type: "image/jpeg" });
    imageUrl = await fal.storage.upload(file);
  }

  if (!imageUrl) {
    return Response.json({ error: "No photo provided" }, { status: 400 });
  }

  const result = await fal.subscribe("fal-ai/flux-kontext-pro", {
    input: {
      image_url: imageUrl,
      prompt,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      image_size: "landscape_4_3",
      enable_safety_checker: true,
    },
  });

  const data = result.data as { images: { url: string }[] };
  return Response.json({ url: data.images[0].url });
}
