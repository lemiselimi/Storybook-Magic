import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory rate limiting: 5 story generations per IP per 24 h
const rateLimitMap = new Map();
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


const THEME_DATA = {
  adventure: {
    title: "The Big Adventure",
    category: "Quest & Exploration",
    arc: [
      "Child steps through a hidden door and enters a magical world for the very first time — wide-eyed, heart pounding.",
      "Child explores and discovers something wondrous: a glowing map, a talking creature, or a voice calling their name.",
      "Following the discovery, child journeys deeper into the magical world, marvelling at its wonders and feeling brave and free.",
      "Child faces their first real obstacle — a crumbling bridge, a locked gate, a creature blocking the path — and tries something that doesn't quite work.",
      "The plan fails and things look worse than before; for a moment the child feels small and unsure they can do this.",
      "A friendly guide or magical creature appears and gives a cryptic clue, but the child must find the courage to act on their own.",
      "Child uses their unique quality — bravery, kindness, or cleverness — to overcome the final challenge in a satisfying, specific way.",
      "Child returns home changed, carrying a small piece of the magical world, knowing the adventure will always be part of them.",
    ],
  },
  dragon: {
    title: "Dragon Tamer",
    category: "Fantasy & Magic",
    arc: [
      "Child discovers a small, frightened dragon hiding in an unexpected place — injured, alone, and desperate for help.",
      "Child earns the dragon's trust slowly, with patience and gentleness, and the dragon reveals it has a secret.",
      "The two become fast friends, and the dragon shows the child the hidden wonders of its world.",
      "A storm or threat arrives; the scared dragon accidentally causes chaos, and the child must stay calm.",
      "In the confusion the dragon flees in fear, and the child is left alone, worried they have lost their new friend.",
      "Child finds the dragon and the two finally understand each other, and the dragon reveals the real danger they must face together.",
      "Child and dragon act as one — dragon flies, child guides — and together they solve the problem no one else could.",
      "The danger is gone; dragon and child share a moment of pure joy, and the child knows this friendship will last forever.",
    ],
  },
  dino: {
    title: "Dinosaur Kingdom",
    category: "Dinosaurs & Discovery",
    arc: [
      "Child steps through a mysterious glowing portal and arrives in a lush prehistoric valley for the very first time — wide-eyed at the towering, gentle dinosaurs all around.",
      "Child meets a small baby dinosaur who has lost its herd and is scared and all alone, and gently promises to help it find its way home.",
      "The two set off together across the valley, and the child marvels at the amazing dinosaurs they pass along the way.",
      "A sudden rumble — a rockslide (or the far-off volcano) blocks the valley path, cutting the pair off from the herd, and the baby dinosaur is frightened.",
      "Child tries the easy, obvious route across the valley and it doesn't work, and for a moment it feels like they might be stuck for good.",
      "Child takes a deep breath and comes up with a braver, cleverer plan, gently encouraging the baby dinosaur to trust them.",
      "Child uses courage and quick thinking to lead the baby dinosaur safely across the valley, reuniting it with its overjoyed herd just in time.",
      "The grateful dinosaurs celebrate together; the child says a warm goodbye and returns home carrying one small keepsake, forever a friend of the dinosaurs.",
    ],
  },
  space: {
    title: "To The Stars",
    category: "Space & Science",
    arc: [
      "Child receives an urgent signal from deep space — a distant planet is in trouble and only one person can help.",
      "Child launches into the cosmos, rocketing past moons and stars, filled with wonder and just a little fear.",
      "Child arrives to find the planet dark and its creatures frightened — the sun is dimming and no one knows why.",
      "Child sets out to explore the strange planet, searching everywhere for what could have gone wrong.",
      "Child's first attempt to help goes wrong and the darkness deepens, leaving them wondering if they came all this way for nothing.",
      "Child discovers the real cause of the problem and realizes the solution is something small and simple they brought from home.",
      "Child activates the solution — light floods back across the planet, creatures cheer, stars burst into colour.",
      "Child returns to Earth as a hero, gazes up at the night sky, and smiles knowing a distant world shines because of them.",
    ],
  },
  ocean: {
    title: "Deep Blue",
    category: "Ocean & Nature",
    arc: [
      "Child dives beneath the waves and discovers a dazzling underwater kingdom full of colour, light, and wonder.",
      "A sea creature swims up in a panic — the coral is going dark and the whole ocean is getting cold.",
      "Child swims deeper into the kingdom to help, meeting playful fish and exploring glittering caves along the way.",
      "Child hits an obstacle — a tangled net, a blocked current, or a sealed cave — that stands between them and the problem.",
      "The first attempt to get through fails, the water grows colder and darker, and the little sea creatures huddle close in fear.",
      "A wise old turtle offers a riddle-clue, but only the child is small enough — or clever enough — to act on it.",
      "Child solves the puzzle — coral blazes back to life in every colour, fish cheer, the whole ocean glows.",
      "Child surfaces home carrying a single shell, and every night holds it to their ear to hear the ocean say thank you.",
    ],
  },
  jungle: {
    title: "Jungle Crown",
    category: "Animals & Wildlife",
    arc: [
      "Child arrives in the jungle and is greeted by a parade of animals who crown them ruler for the day.",
      "Child explores the kingdom — every creature has a job, a name, and something to show their new leader.",
      "Child is welcomed with a joyful feast, feeling proud and happy to be trusted by the whole jungle.",
      "Two animals fall into a fierce argument and the whole jungle begins taking sides — only the child can settle it fairly.",
      "Child's first idea to make peace backfires, the quarrel grows louder, and it seems the jungle may never agree.",
      "Child stops to listen carefully to both sides, and slowly a fair, unexpected solution begins to take shape.",
      "Child shares a creative solution no animal had thought of — peace is restored and the jungle erupts in celebration, dancing and singing, the canopy exploding with colour.",
      "The crown is returned at sunset, but as child leaves, every animal calls out: 'You'll always be our queen/king.'",
    ],
  },
  superpower: {
    title: "My Superpower",
    category: "Real Life Heroes",
    arc: [
      "Child feels ordinary — everyone else seems to have a special talent, and they're still searching for theirs.",
      "Something goes wrong in the community — a problem no adult or expert can fix, and people are starting to give up.",
      "Child decides to try and help, even though they're not sure what they can possibly do.",
      "Child's first attempt stumbles badly — it doesn't work, people are disappointed, and real doubt creeps in.",
      "Feeling defeated, the child almost gives up and wonders if they have anything special to offer at all.",
      "A neighbour, teacher, or friend gently points out something the child does naturally, without thinking, that nobody else can.",
      "Child uses that exact quality — empathy, creativity, stubborn persistence, or boundless imagination — to solve the problem completely.",
      "The community comes together in celebration, and child realises: the superpower was always theirs — they just needed to find it.",
    ],
  },
  dreamland: {
    title: "Off to Dreamland",
    category: "Bedtime & Dreams",
    arc: [
      "As the stars come out and the house grows quiet, the child snuggles into bed and a soft silver moonbeam gently invites them on a dream journey.",
      "Child floats up through drifting, glowing clouds into a calm, warm dreamland where everything is soft, hushed, and gently sparkling.",
      "Child meets a sleepy, cloud-soft dream creature who is sad because some of the little stars that light the night have drifted away and gone dim.",
      "Together they set off across the dreamland, floating over pillow-soft hills and quiet moonlit pools in search of the lost stars.",
      "One by one the child gathers the little stars, cupping each warm glow in their hands as the dreamland grows cosier and calmer.",
      "One last star has drifted high and far, and the sleepy child must gently and patiently coax it back down.",
      "Child reaches up to hang the very last star, and the whole dreamland glows with a soft golden hush as everyone grows peacefully sleepy.",
      "The moonbeam carries the child gently home to their cozy bed, and they close their eyes — safe, warm, and loved — and drift softly off to sleep.",
    ],
  },
};

function getAgeBand(ageNum) {
  if (ageNum <= 3)  return "1-3";
  if (ageNum <= 6)  return "4-6";
  if (ageNum <= 9)  return "7-9";
  return "10-12";
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
    const { childName: rawName, childAge, gender, themeId } = body;

    const childName = String(rawName || "").replace(/["\n\\]/g, " ").trim().slice(0, 60);
    const ageNum    = Number(childAge) || 5;
    const ageBand   = getAgeBand(ageNum);
    const pronouns  = gender === "girl" ? "she/her" : gender === "boy" ? "he/him" : "they/them";

    const theme = THEME_DATA[themeId] ?? THEME_DATA.adventure;

    console.log("Story API:", { childName, ageNum, ageBand, pronouns, themeId });

    const arcJson = JSON.stringify(theme.arc);

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: `You are a children's book author writing personalized illustrated storybooks for "My Tiny Tales." Each book is 8 pages, one short story moment per page. The book is being made as a keepsake — emotional, beautiful, and treasured.

YOUR TASK:
Write exactly 8 pages of story. Each page is ONE story beat from the story_arc, adapted to the child's age band. For EACH page also write a matching "illustration" — a concrete visual description of that exact story moment, so the picture on the page shows what the words on the page describe. Return ONLY valid JSON in this structure:
{"title":"string — a custom book title using the child's name (e.g. 'Lily's Deep Blue Magic')","dedication":"string — one warm line dedicated to the child, e.g. 'For Aria, the bravest explorer in the cosmos'","pages":[{"pageNum":1,"text":"...","illustration":"..."},{"pageNum":2,"text":"...","illustration":"..."},{"pageNum":3,"text":"...","illustration":"..."},{"pageNum":4,"text":"...","illustration":"..."},{"pageNum":5,"text":"...","illustration":"..."},{"pageNum":6,"text":"...","illustration":"..."},{"pageNum":7,"text":"...","illustration":"..."},{"pageNum":8,"text":"...","illustration":"..."}]}

UNIVERSAL RULES (every age band):
- The CHILD is the hero. Always center them in the action. Never let a sidekick or parent steal the moment.
- Use the child's name on most pages, naturally — not every page, but most.
- Use the correct pronouns throughout.
- Ending must be warm, victorious, or emotionally resolved. No cliffhangers, no sadness on page 6.
- No violence beyond mild adventure peril (chasing, racing, gentle danger). No weapons used to harm anyone.
- No romance, no scary villains, no death, no bodily fluids, no toilet humor.
- No real-world public figures, no copyrighted characters.
- No commentary, no preamble — return ONLY the JSON.
- Page text must NOT include the chapter number or "Page X" — only the story text itself.

WRITING QUALITY (this is what separates a treasured keepsake from generic AI filler — take it seriously):
- Show, don't tell. Never flatly state an emotion ("Leo was brave", "she felt happy"). Dramatize it through a specific action, a physical sensation, or a small telling detail.
- Give every page ONE concrete, sensory image the reader can actually see, hear, or feel — a real thing, not vague "wonder" or "magic".
- BANNED phrases and clichés — never use any of these or anything like them: "little did they know", "adventure of a lifetime", "heart full of courage/hope", "magical journey", "from that day on", "more than they ever imagined", "eyes lit up", "big smile", "took a deep breath", "with all their might", "the adventure was just beginning", "happily ever after".
- Strong concrete nouns and vivid verbs beat piles of adjectives and adverbs. Cut every word that is not pulling weight.
- Vary the sentence rhythm — mix short punchy lines with longer flowing ones. It must read aloud with music; a parent will read this at bedtime.
- Give the child one small, specific, human touch — a habit, an object they love, a line of real-sounding dialogue — so this feels like a story about THIS child, not any child.
- Earn the ending. The final warmth should land because of what actually happened in the story, not because you asserted a moral.

AGE BAND VOICE GUIDE:
If age_band = "1-3" (Toddler): 1-2 short sentences per page. Vocabulary a 2-year-old recognizes. Heavy sound words: whoosh!, boom!, yay!, zoom! Lots of repetition and rhythm. Total ~40-80 words.
If age_band = "4-6" (Pre-K): 3-5 sentences per page. Simple emotions named directly: brave, nervous, proud, happy. Short dialogue and sound words welcome. Active verbs. Total ~200-300 words.
If age_band = "7-9" (Early Reader): 5-6 sentences per page. Varied sentence structure. Light internal thoughts. More nuanced emotions: doubt, determination, hope, relief. Light sensory detail. Total ~300-400 words.
If age_band = "10-12" (Middle Grade): 6-8 sentences per page. Richer interior life. Light metaphor and sensory writing. Subtle foreshadowing, payoff later. Emotional complexity welcome. Total ~500-650 words.

STRUCTURE OF THE EIGHT PAGES (universal):
- Page 1: Opening — introduce the child in the world of the adventure. Establish the dream/goal.
- Page 2: The journey begins. First action, first taste of the adventure.
- Page 3: Discovery and wonder — the child explores deeper and the world opens up.
- Page 4: A challenge appears. Stakes rise.
- Page 5: The low moment. Doubt, difficulty, or the biggest obstacle.
- Page 6: Regroup — the child gathers their courage and finds a fresh idea or new resolve.
- Page 7: The breakthrough. The child overcomes through their own courage/kindness/cleverness.
- Page 8: Triumph and warmth. The reward, the celebration, and a quiet emotional beat for the keepsake.

TITLE RULE:
- The book title should include the child's name and feel like a real picture book title.
- Examples: "Lily's Brave Penalty Kick", "Theo and the Lonely Dragon", "Aria's Deep Blue Secret"
- Avoid generic titles like "The Adventure" or "A Magical Day"

SUBTITLE RULE:
- 3-6 words evoking the category emotion.
- Examples: "A Dragon's Tale", "A Fairy-Tale Friendship", "An Ocean Adventure"
- Put this in the "dedication" field as a companion to the warm dedication line — format: "For [Name], [warm line]. [Subtitle]."

ILLUSTRATION RULE (this is what makes the picture match the words):
- For each page, the "illustration" must depict the SAME moment the page text describes — same action, same setting, same emotion. If the text says the child is kneeling over a broken generator at dusk, the illustration describes exactly that.
- Describe it as a single, concrete visual: what the child is physically doing, their expression, the key objects around them, and the setting/time of day. One vivid sentence, 15-30 words.
- Centre the child performing the page's action. Name the one or two scene elements that anchor this beat (the float, the rope bridge, the glowing portal) so consecutive pages look distinct from each other.
- Do NOT include art-style words, camera directions, lighting, "Pixar", "3D", or the child's name — only the literal content of the scene. Styling is added later.
- Keep it physically consistent with the story_arc beat for that page.

FINAL CHECK BEFORE RETURNING:
- All 8 pages written, each with a matching illustration? ✓
- Does each illustration depict the same moment as its page text? ✓
- Age band voice consistent across all pages? ✓
- Child is the hero on every page? ✓
- Ending warm and resolved? ✓
- Valid JSON, no extra text? ✓`,
      messages: [{
        role: "user",
        content: `<child_name>${childName}</child_name>
<child_pronouns>${pronouns}</child_pronouns>
<age_band>${ageBand}</age_band>
<adventure_title>${theme.title}</adventure_title>
<adventure_category>${theme.category}</adventure_category>
<story_arc>${arcJson}</story_arc>`,
      }],
    });

    // With adaptive thinking enabled, content[0] may be a thinking block —
    // pull the text block explicitly rather than assuming index 0.
    const textBlock = response.content.find(b => b.type === "text");
    const text = textBlock?.text ?? "";
    console.log("Raw response:", text.substring(0, 200));
    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    console.log("Parsed successfully, pages:", parsed.pages?.length);

    return Response.json(parsed);
  } catch (err) {
    console.error("Story API error:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
