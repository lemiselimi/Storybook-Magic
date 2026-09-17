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
- For toddlers, use concrete, rhythmic language and gentle repetition. For older readers, use richer vocabulary, natural dialogue, a real choice, and more layered discovery without becoming babyish.

RETURN ONLY valid JSON in exactly this shape:
{"title":"string","dedication":"string","pages":[{"pageNum":1,"text":"string","illustration":"string"},{"pageNum":2,"text":"string","illustration":"string"},{"pageNum":3,"text":"string","illustration":"string"},{"pageNum":4,"text":"string","illustration":"string"},{"pageNum":5,"text":"string","illustration":"string"},{"pageNum":6,"text":"string","illustration":"string"},{"pageNum":7,"text":"string","illustration":"string"},{"pageNum":8,"text":"string","illustration":"string"}]}

WRITING RULES
- Begin with an invitation, discovery, or immediate story moment. Give the child a clear reason to continue.
- Include a small problem, mystery, challenge, or goal; escalation; a choice or attempt by the child; a satisfying resolution; and a warm closing that connects back to them.
- Use the child's name naturally in several scenes, not mechanically in every sentence. Do not invent hobbies, family details, favorite objects, or biographical facts that were not provided.
- Let concrete nouns and vivid verbs do the work. Give each scene one observable sensory detail.
- Use natural dialogue only when it advances the moment. Vary sentence rhythm for read-aloud quality.
- Avoid generic AI prose, adjective piles, unnecessary exclamation marks, constant use of words such as "magical," "sparkling," "amazing," or repetitive praise of the child.
- Never use these phrases or close variants: "little did they know", "adventure of a lifetime", "heart full of courage", "magical journey", "from that day on", "more than they ever imagined", "eyes lit up", "big smile", "took a deep breath", "with all their might", "the adventure was just beginning", "happily ever after".
- No violence beyond mild, child-safe adventure tension. No weapons, scary villains, romance, death, bodily functions, public figures, or copyrighted characters.
- The title includes the child's name and sounds like a real picture book title. The dedication is one restrained warm line beginning "For [Name],"; do not append a subtitle, theme name, template fragment, or internal label.

ILLUSTRATION RULES
- Each illustration describes the exact same moment as its text: child action, setting, and the one or two key visual anchors.
- Use one concrete visual sentence of 15-30 words. Do not use art-style words, camera directions, brand names, the child's name, or metadata.
- Keep the child as the subject, but leave enough environmental context for a distinct scene.

EIGHT-BEAT BRIEF
${JSON.stringify(theme.arc)}

FINAL CHECK
- Exactly eight complete scenes, in order.
- The child actively drives the change in scenes 5-7.
- The emotional heart is earned by the resolution, not stated as a lesson.
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
    const theme = STORY_THEMES[body.themeId] ?? STORY_THEMES.adventure;

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
