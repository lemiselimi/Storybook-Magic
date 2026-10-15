import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/security";
import { AGE_BANDS, getAgeBand, STORY_THEMES } from "@/lib/story-themes";
import { MAX_WORDS_PER_PAGE, validateStory } from "@/lib/story-quality";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
function storyPrompt({ theme, ageBand }) {
  const age = AGE_BANDS[ageBand];
  return `You are My Tiny Tales' in-house children's-book writer. Write an original, illustrated keepsake story in a warm, literary voice. This is story-first publishing: the emotional heart is felt through what happens, never explained as a lesson.

THE STORY BRIEF
- Adventure: ${theme.title} (${theme.category})
- Emotional heart: ${theme.emotionalHeart}
- The emotional heart must emerge through the child's choices, actions, and the ending. Never announce a moral, therapeutic lesson, or character trait.
- The child is the hero who notices, decides, helps, tries again, or solves the key problem. They are never a passenger while others fix things.
- Use the supplied eight-beat arc as a guide, but keep the flow natural rather than formulaic.

AGE AND LAYOUT
- Audience: ${age.label}, ${ageBand} years.
- Use ${age.sentences} per scene, around ${age.wordsPerPage} words per scene, never more than ${MAX_WORDS_PER_PAGE[ageBand]} words on a scene. Total target: ${age.totalWords} words.
- Keep every scene short enough for a single printed story page. Do not use long paragraphs.
- An adult reads toddler books aloud. Simple vocabulary must still form a complete story, not terse image captions. Use warm dialogue, clear cause and effect, and a recurring phrase that changes meaning as the child acts. Introduce the friend and their specific problem before resolving it. Show the journey home. Avoid broken grammar such as "Rainbow shiny" or "breathes soft". Use \n line breaks for natural spoken beats, encoded as JSON escapes.
- For toddlers, use concrete, rhythmic language and gentle repetition. For older readers, use richer vocabulary, natural dialogue, a real choice, and more layered discovery without becoming babyish.

RETURN ONLY valid JSON in exactly this shape:
{"title":"string","dedication":"string","pages":[{"pageNum":1,"text":"string","illustration":"string"},{"pageNum":2,"text":"string","illustration":"string"},{"pageNum":3,"text":"string","illustration":"string"},{"pageNum":4,"text":"string","illustration":"string"},{"pageNum":5,"text":"string","illustration":"string"},{"pageNum":6,"text":"string","illustration":"string"},{"pageNum":7,"text":"string","illustration":"string"},{"pageNum":8,"text":"string","illustration":"string"}]}

WRITING RULES
- Begin with an invitation, discovery, or immediate story moment. Give the child a clear reason to continue. Never open with a bare greeting such as "Good morning, [Name]!"; the first scene shows where the child is and what is happening before anyone speaks to them.
- Keep a small, fixed cast. Give each animal character one exact species and call it by that same word in every scene. Never use two look-alike species as separate characters (toucan and parrot, frog and toad, rabbit and hare, seal and sea lion).
- When the child's first attempt fails, let the failure land: show concretely why it did not work for each side before the child tries again. Do not resolve it in the same breath.
- Include a small problem, mystery, challenge, or goal; escalation; a choice or attempt by the child; a satisfying resolution; and a warm closing that connects back to them.
- Use the child's name naturally in several scenes, not mechanically in every sentence. Do not invent hobbies, family details, favorite objects, or biographical facts that were not provided.
- Let concrete nouns and vivid verbs do the work. Give each scene one observable sensory detail.
- Use natural dialogue only when it advances the moment. Vary sentence rhythm for read-aloud quality.
- Avoid generic AI prose, adjective piles, unnecessary exclamation marks, constant use of words such as "magical," "sparkling," "amazing," or repetitive praise of the child.
- Never use these phrases or close variants: "little did they know", "adventure of a lifetime", "heart full of courage", "magical journey", "from that day on", "more than they ever imagined", "eyes lit up", "big smile", "took a deep breath", "with all their might", "the adventure was just beginning", "happily ever after".
- No violence beyond mild, child-safe adventure tension. No weapons, scary villains, romance, death, bodily functions, public figures, or copyrighted characters.
- The title includes the child's name and sounds like a real picture book title. The dedication is one restrained warm line beginning "For [Name],"; do not append a subtitle, theme name, template fragment, or internal label. The dedication is read before the story, so it must not name, hint at, or summarise the emotional heart, lesson, or trait the story is about (not "who listens", "who is brave", "who shares"); keep it open-ended and personal.

ILLUSTRATION RULES
- Each illustration describes the exact same moment as its text: child action, setting, and the one or two key visual anchors.
- Use one concrete visual sentence of 15-30 words. Do not use art-style words, camera directions, brand names, the child's name, the companion's name, or metadata.
- A keepsake the companion leaves behind must be described exactly as it looked on the companion earlier (same object, size, colour and attachment), never as a different object.
- Keep the child as the subject, but leave enough environmental context for a distinct scene.
- Name every animal in the scene by its exact species, matching the text, and add no other named animals. The child is the only person: no other children, adults, princesses, or characters absent from the text. No buildings, ruins, temples, pyramids, or landmarks unless the text names them.
- Choose one consistent outfit and one concrete recurring companion design; repeat these anchors in each illustration where present. Keep hair, age, proportions, clothing colors, and companion appearance consistent. Do not change outfit except for an explicit story action.

EIGHT-BEAT BRIEF
${JSON.stringify(theme.arc)}

FINAL CHECK
- Exactly eight complete scenes, in order.
- The child actively drives the change in scenes 5-7.
- The emotional heart is earned by the resolution, not stated as a lesson.
- Resolve the exact problem introduced. Do not confuse a lost physical object with an ability regained.
- The companion is always ${theme.companion}. Describe it this way in every illustration where it appears, and preserve its design and size.
- Give the companion one short, warm, easy-to-say name (one or two syllables), introduced in scene 1 or 2 and used consistently in the text. Never the child's name, and never a famous character's name (no Rudolph, Dasher, Nemo, Dumbo, Toothless or similar).
- The child is ${theme.outfit}. If the text mentions clothing, it must match this exactly; never invent other clothing, colours or accessories. At bedtime the child may change into pyjamas.
- For the dragon adventure, the dragon cannot make its flame because it is frightened; its flame has not flown away.
- For the Christmas Eve adventure, Santa never appears; the sleigh team stays offstage.
- Check every illustration against its full passage: if the dragon freezes or crouches, it must not run or chase. Do not invent hair, hair length or hairstyle; these come from the child reference photo.
- Every scene fits the word limit and has a matching illustration.
- Valid JSON only, with no commentary.`;
}

export async function POST(request) {
  try {
    const limit = await rateLimit(request, "story", 5, 24 * 60 * 60);
    if (!limit.allowed) {
      return Response.json(
        { error: "limit_reached", message: "You've reached the maximum of 5 free previews in 24 hours. Purchase your book to continue." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    }

    const body = await request.json();
    const childName = String(body.childName || "").replace(/["\n\\]/g, " ").trim().slice(0, 60);
    const ageNum = Number(body.childAge) || 5;
    const ageBand = getAgeBand(ageNum);
    const pronouns = body.gender === "girl" ? "she/her" : body.gender === "boy" ? "he/him" : "they/them";
    const theme = STORY_THEMES[body.themeId] ?? STORY_THEMES.dreamland;

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: storyPrompt({ theme, ageBand }),
      messages: [{
        role: "user",
        content: `<child_name>${childName}</child_name>\n<child_pronouns>${pronouns}</child_pronouns>\n<child_age>${ageNum}</child_age>\n<age_band>${ageBand}</age_band>\n<adventure_title>${theme.title}</adventure_title>\n<emotional_heart>${theme.emotionalHeart}</emotional_heart>`,
      }],
    });

    const text = response.content.find((block) => block.type === "text")?.text ?? "";
    const story = JSON.parse(text.replace(/```json|```/g, "").trim());
    const issue = validateStory(story, { childName, ageBand });
    if (issue) {
      console.error("Story quality check failed:", issue);
      return Response.json({ error: "story_quality_check_failed" }, { status: 502 });
    }
    return Response.json(story);
  } catch (error) {
    console.error("Story API error:", error.message);
    return Response.json({ error: "story_generation_failed" }, { status: 500 });
  }
}
