import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory rate limiting: 3 story generations per IP per 24 h
// (resets on cold start; acceptable without a KV store)
const rateLimitMap = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT  = 3;
const RATE_WINDOW = 24 * 60 * 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return Response.json(
        { error: "limit_reached", message: "You've reached the maximum of 3 free previews in 24 hours. Purchase your book to continue." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { childName, childAge, gender, theme, hairColor, eyeColor } = body;

    console.log("Story API called with:", { childName, childAge, gender, theme, hairColor, eyeColor });

    const hairDesc       = hairColor ? `${hairColor.replace(/-/g, " ")} hair` : "";
    const eyeDesc        = eyeColor  ? `${eyeColor.replace(/-/g, " ")} eyes`  : "";
    const appearanceParts = [hairDesc, eyeDesc].filter(Boolean);
    // Appearance is passed only for illustration descriptions — never mentioned in story text
    const appearanceNote = appearanceParts.length
      ? `Appearance for illustration descriptions only: ${appearanceParts.join(", ")}. Use this ONLY in the "illustration" fields, never in the story text.`
      : "";

    const ageNum = Number(childAge) || 5;
    let ageGuidance;
    if      (ageNum <= 2)  ageGuidance = "TODDLER (1-2 yrs): extremely simple 1-sentence text per page, very basic vocabulary, rhyming if possible. Illustrations should show a tiny toddler.";
    else if (ageNum <= 4)  ageGuidance = "PRESCHOOLER (3-4 yrs): simple short sentences, basic words, playful tone. Illustrations show a small preschooler.";
    else if (ageNum <= 7)  ageGuidance = "EARLY READER (5-7 yrs): short sentences, simple vocabulary, exciting action. Illustrations show a young child.";
    else if (ageNum <= 10) ageGuidance = "MIDDLE GRADE (8-10 yrs): richer vocabulary, more complex sentences, emotional depth.";
    else                   ageGuidance = "PRETEEN (11-12 yrs): sophisticated vocabulary, nuanced emotions, more complex plot.";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `Create a 6-page children's book for ${childName || "a child"}, age ${childAge || 5}, gender: ${gender === "girl" ? "girl (use she/her)" : gender === "boy" ? "boy (use he/him)" : "neutral (use they/them)"}, with the theme: ${theme}. ${appearanceNote}

IMPORTANT: Never describe the child's physical appearance in the story text. Do not mention hair colour, eye colour, skin tone, height, or any physical traits. The story should focus entirely on personality, actions, emotions, and adventure.

Age writing level — ${ageGuidance}

The "illustration" field for each page must be a vivid, detailed scene description for AI image generation (1-2 sentences). IMPORTANT: always describe the main character's age accurately — e.g. "a tiny toddler" for age 1-2, "a small young child" for age 3-5, etc. Describe: the environment/setting, what the main character is doing, mood/lighting, and any magical or theme-specific elements. Be specific and visual. Example: "A cozy bedroom at dawn with floating glowing stars, the child sitting up in bed holding a treasure map that pulses with golden light, moonbeams streaming through the window."

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
