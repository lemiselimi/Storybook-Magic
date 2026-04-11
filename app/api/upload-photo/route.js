import { fal } from "@fal-ai/client";

export const maxDuration = 30;

export async function POST(request) {
  fal.config({ credentials: process.env.FAL_API_KEY });
  try {
    const { photoBase64 } = await request.json();
    if (!photoBase64) return Response.json({ error: "photoBase64 required" }, { status: 400 });

    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const file = new File([blob], "reference.jpg", { type: "image/jpeg" });
    const url = await fal.storage.upload(file);

    return Response.json({ url });
  } catch (err) {
    console.error("Upload photo error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
