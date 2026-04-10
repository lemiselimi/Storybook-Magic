import { fal } from "@fal-ai/client";

export const maxDuration = 60;

export async function POST(request: Request) {
  fal.config({ credentials: process.env.FAL_API_KEY });

  const body = await request.json();
  const { imageUrl, photoBase64, prompt } = body as {
    imageUrl?: string;
    photoBase64?: string;
    prompt: string;
  };

  let referenceUrl = imageUrl;

  if (!referenceUrl && photoBase64) {
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const file = new File([blob], "reference.jpg", { type: "image/jpeg" });
    referenceUrl = await fal.storage.upload(file);
  }

  if (!referenceUrl) {
    return Response.json({ error: "No photo provided" }, { status: 400 });
  }

  const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
    input: {
      prompt,
      image_url: referenceUrl,
    },
  });

  const data = result.data as { images: { url: string }[] };
  return Response.json({ url: data.images[0].url });
}
