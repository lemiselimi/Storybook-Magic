import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const body = await request.json();
    const { childName, childAge, gender, theme, hairColor, eyeColor } = body;

    console.log("Story API called with:", { childName, childAge, gender, theme, hairColor, eyeColor });

    const hairDesc       = hairColor ? `${hairColor.replace(/-/g, " ")} hair` : "";
    const eyeDesc        = eyeColor  ? `${eyeColor.replace(/-/g, " ")} eyes`  : "";
    const appearanceParts = [hairDesc, eyeDesc].filter(Boolean);
    const appearanceNote = appearanceParts.length
      ? `The child has ${appearanceParts.join(" and ")}. Mention this naturally once early in the story.`
      : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Create a 6-page children's book for ${childName || "a child"}, age ${childAge || 5}, gender: ${gender === "girl" ? "girl (use she/her)" : gender === "boy" ? "boy (use he/him)" : "neutral (use they/them)"}, with the theme: ${theme}. ${appearanceNote}

The "illustration" field for each page must be a vivid, detailed scene description for AI image generation (1-2 sentences). Describe: the environment/setting, what the main character is doing, mood/lighting, and any magical or theme-specific elements. Be specific and visual. Example: "A cozy bedroom at dawn with floating glowing stars, the child sitting up in bed holding a treasure map that pulses with golden light, moonbeams streaming through the window."

Respond ONLY with this exact JSON, no markdown, no extra text:
{"title":"Book Title","dedication":"Sweet dedication to the child","pages":[{"pageNum":1,"text":"Page story text here (2-3 sentences).","illustration":"Detailed scene description for image generation."},{"pageNum":2,"text":"Page story text here.","illustration":"Detailed scene description."},{"pageNum":3,"text":"Page story text here.","illustration":"Detailed scene description."},{"pageNum":4,"text":"Page story text here.","illustration":"Detailed scene description."},{"pageNum":5,"text":"Page story text here.","illustration":"Detailed scene description."},{"pageNum":6,"text":"Page story text here.","illustration":"Detailed scene description."}]}`
      }]
    });

    const text = response.content[0].text;
    console.log("Raw response:", text.substring(0, 200));
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    console.log("Parsed successfully, pages:", parsed.pages?.length);
    return Response.json(parsed);
  } catch (err) {
    console.error("Story API error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
