import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory rate limiting: 5 story generations per IP per 24 h
// (resets on cold start; acceptable without a KV store)
const rateLimitMap = new Map(); // ip -> { count, resetAt }
const RATE_LIMIT  = 5;
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
        { error: "limit_reached", message: "You've reached the maximum of 5 free previews in 24 hours. Purchase your book to continue." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { childName: rawName, childAge, gender, theme: rawTheme, hairColor, eyeColor } = body;

    // Sanitize user inputs before interpolating into prompts
    const childName = String(rawName || "").replace(/["\n\\]/g, " ").trim().slice(0, 60);
    const theme     = String(rawTheme || "").replace(/["\n\\]/g, " ").trim().slice(0, 200);

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

    const pronouns = gender === "girl" ? "she/her" : gender === "boy" ? "he/him" : "they/them";
    const pronoun  = gender === "girl" ? "she"     : gender === "boy" ? "he"     : "they";
    const name     = childName || "our hero";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1800,
      messages: [{
        role: "user",
        content: `You are a world-class children's book author — think the warmth of Julia Donaldson, the imagination of Roald Dahl, and the emotional punch of Pixar. Write a 6-page personalised storybook.

CHILD: ${name}, age ${childAge || 5}, pronouns ${pronouns}
THEME: ${theme}
${appearanceNote}

STORY RULES:
- Page 1: Open with a single vivid sentence that drops us straight into the world — no "once upon a time". Establish ${name}'s world and hint at what ${pronoun} wants most.
- Page 2: Something unexpected happens — a discovery, a call to adventure, a problem that only ${name} can solve.
- Page 3: ${name} faces their first real challenge. ${pronoun.charAt(0).toUpperCase() + pronoun.slice(1)} tries something and it doesn't quite work. Show courage despite doubt.
- Page 4: The stakes rise. Things get harder or more magical. A helper, creature, or surprise appears.
- Page 5: The climax — ${name}'s unique quality (bravery, kindness, cleverness, imagination) saves the day in a specific, satisfying way.
- Page 6: A warm, earned resolution. The world has changed because ${name} was in it. End on one short, resonant sentence.

WRITING RULES:
- Age level: ${ageGuidance}
- Use ${name}'s name naturally — not in every sentence, but enough to feel personal
- Use specific, concrete details — not "a big tree" but "an oak tree so wide it took ten hugs to reach around"
- Use sound words, action verbs, and short punchy sentences for excitement
- Every page must end on a moment that makes you want to turn the page
- NEVER describe physical appearance (hair, eyes, skin, height) — focus on actions, feelings, and personality
- Pronouns: ${pronouns}

ILLUSTRATION RULES:
- Each "illustration" field: 1-2 vivid sentences describing the scene for an AI image generator
- Always specify the age accurately: ${ageNum <= 2 ? "a tiny baby toddler" : ageNum <= 4 ? "a small preschooler" : ageNum <= 7 ? "a young child" : "an older child"}
- Describe: setting, what the character is doing, emotion on their face, lighting/mood, any magical elements
- Make each scene visually distinct from the others — vary the setting, lighting, and composition

Respond ONLY with this exact JSON, no markdown, no extra text:
{"title":"A short punchy book title (max 5 words)","dedication":"A warm one-line dedication to ${name}","pages":[{"pageNum":1,"text":"Page text.","illustration":"Scene description."},{"pageNum":2,"text":"Page text.","illustration":"Scene description."},{"pageNum":3,"text":"Page text.","illustration":"Scene description."},{"pageNum":4,"text":"Page text.","illustration":"Scene description."},{"pageNum":5,"text":"Page text.","illustration":"Scene description."},{"pageNum":6,"text":"Page text.","illustration":"Scene description."}]}`
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
