import { fal } from "@fal-ai/client";

export const maxDuration = 120;

const TEST_SCENES = [
  "a magical glowing forest with friendly woodland creatures and fireflies lighting the path",
  "a rocket ship cockpit launching into space, surrounded by swirling galaxies and glowing stars",
  "an underwater kingdom with colourful coral reefs, friendly fish, and beams of sunlight filtering down",
];

function buildPrompt(scene: string) {
  return (
    `Transform this photo into a cinematic 3D-style children's book illustration. ` +
    `Keep the child's exact face, features and likeness. ` +
    `Place them in ${scene}. ` +
    `Style: warm volumetric lighting, soft depth of field, magical storybook atmosphere, ` +
    `professional children's book illustration, Pixar-inspired 3D render quality. ` +
    `The child should be the clear hero of the scene. ` +
    `No text, no words, no letters anywhere in the image. ` +
    `Child must be fully clothed in adventure-appropriate clothing for the scene.`
  );
}

export async function POST(request: Request) {
  fal.config({ credentials: process.env.FAL_API_KEY });

  const body = await request.json();
  const { imageUrl, photoBase64 } = body as {
    imageUrl?: string;
    photoBase64?: string;
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

  // Run all 3 scene prompts in parallel
  const results = await Promise.all(
    TEST_SCENES.map(async (scene) => {
      const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
        input: {
          prompt: buildPrompt(scene),
          image_url: referenceUrl,
        },
      });
      const data = result.data as { images: { url: string }[] };
      return { scene, url: data.images[0].url };
    })
  );

  return Response.json({ results });
}
