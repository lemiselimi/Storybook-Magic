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
  july4: {
    title: "Fireworks Night",
    category: "A Fourth of July Story",
    arc: [
      "MORNING AT HOME: Child wakes up on the Fourth of July, gets dressed in their red, white, and blue outfit, and stands at the front door bursting with pride — they have been chosen to lead the whole town's parade today.",
      "MIDDAY ON MAIN STREET: Child marches at the very front of the parade, flag held high, the packed crowd on both sides of the street cheering and waving as the band plays behind them.",
      "LATE AFTERNOON NEAR THE FLOAT: The parade float's generator suddenly fails and goes dark — with no power, the grand fireworks finale is in danger of being cancelled. The child kneels over the broken equipment, determined not to let the town down.",
      "GOLDEN HOUR ON THE KERB: Child sits alone for a quiet moment, elbows on knees, thinking hard. It feels impossible. But giving up is not an option.",
      "TWILIGHT ON THE FLOAT: Child has an idea — rallies every person nearby, and together the whole town pitches in. The float blazes back to life, lights exploding on, the crowd erupting in cheers.",
      "NIGHT ON THE STAGE: The child stands on the stage with arms raised as spectacular red, white, and blue fireworks burst overhead, the whole town below cheering their name into the night sky.",
    ],
  },
  adventure: {
    title: "The Big Adventure",
    category: "Quest & Exploration",
    arc: [
      "Child steps through a hidden door and enters a magical world for the very first time — wide-eyed, heart pounding.",
      "Child explores and discovers something wondrous: a glowing map, a talking creature, or a voice calling their name.",
      "Child faces their first real obstacle — a crumbling bridge, a locked gate, a creature blocking the path — and tries something that doesn't quite work.",
      "A friendly guide or magical creature appears and gives a cryptic clue, but the child must act on their own.",
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
      "A storm or threat arrives; the scared dragon accidentally causes chaos, and the child must stay calm.",
      "Child and dragon find a way to truly understand each other, and the dragon reveals the real danger they must face together.",
      "Child and dragon act as one — dragon flies, child guides — and together they solve the problem no one else could.",
      "The danger is gone; dragon and child share a moment of pure joy, and the child knows this friendship will last forever.",
    ],
  },
  space: {
    title: "To The Stars",
    category: "Space & Science",
    arc: [
      "Child receives an urgent signal from deep space — a distant planet is in trouble and only one person can help.",
      "Child launches into the cosmos, rocketing past moons and stars, filled with wonder and just a little fear.",
      "Child arrives to find the planet dark and its creatures frightened — the sun is dimming and no one knows why.",
      "Child discovers the cause of the problem and realizes the solution is something small they brought from home.",
      "Child activates the solution — light floods back across the planet, creatures cheer, stars burst into colour.",
      "Child returns to Earth as a hero, gazes up at the night sky, and smiles knowing a distant world shines because of them.",
    ],
  },
  ocean: {
    title: "Deep Blue",
    category: "Ocean & Nature",
    arc: [
      "Child dives beneath the waves and discovers a dazzling underwater kingdom full of colour, light, and wonder.",
      "A sea creature swims up in a panic — the coral is going dark and the ocean is getting cold.",
      "Child explores to find the source of the problem and hits an obstacle: a tangled net, a blocked current, a sealed cave.",
      "A wise old turtle offers a riddle-clue, but only the child is small or clever enough to act on it.",
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
      "Two animals are in a fierce argument and the whole jungle is taking sides — only the child can settle it fairly.",
      "Child listens carefully to both sides and comes up with a creative, unexpected solution no animal had thought of.",
      "Peace is restored — the jungle erupts in celebration, animals dancing, birds singing, the canopy exploding with colour.",
      "The crown is returned at sunset, but as child leaves, every animal calls out: 'You'll always be our queen/king.'",
    ],
  },
  superpower: {
    title: "My Superpower",
    category: "Real Life Heroes",
    arc: [
      "Child feels ordinary — everyone else seems to have a special talent, and they're still searching for theirs.",
      "Something goes wrong in the community — a problem no adult or expert can fix, and people are starting to give up.",
      "Child tries to help but stumbles badly — it doesn't work the first time, and real doubt creeps in.",
      "A neighbour, teacher, or friend gently points out something the child does naturally, without thinking, that nobody else can.",
      "Child uses that exact quality — empathy, creativity, stubborn persistence, or boundless imagination — to solve the problem completely.",
      "The community comes together in celebration, and child realises: the superpower was always theirs — they just needed to find it.",
    ],
  },
  worldcup: {
    title: "World Cup Hero",
    category: "Football & Glory",
    arc: [
      "Child walks out of the tunnel onto the World Cup final pitch as the roar of the crowd shakes the ground beneath their boots.",
      "Child sprints with the ball deep into opposition territory, leaving two defenders stumbling, the crowd rising to their feet.",
      "USA fall behind — the clock is ticking, and all eyes on the pitch turn to the child as the weight of the nation lands on their shoulders.",
      "Child wins a crucial penalty in the dying minutes and steps up alone to the spot, the whole world holding its breath.",
      "Child blasts the ball into the top corner — the net explodes, the crowd erupts, teammates pile on — USA have won the World Cup.",
      "Child lifts the golden trophy high above their head as fireworks light up the night sky and every fan chants their name.",
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
      system: `You are a children's book author writing personalized illustrated storybooks for "My Tiny Tales." Each book is 6 pages, one short story moment per page. The book is being made as a keepsake — emotional, beautiful, and treasured.

YOUR TASK:
Write exactly 6 pages of story. Each page is ONE story beat from the story_arc, adapted to the child's age band. For EACH page also write a matching "illustration" — a concrete visual description of that exact story moment, so the picture on the page shows what the words on the page describe. Return ONLY valid JSON in this structure:
{"title":"string — a custom book title using the child's name (e.g. 'Lily's World Cup Magic')","dedication":"string — one warm line dedicated to the child, e.g. 'For Aria, the bravest explorer in the cosmos'","pages":[{"pageNum":1,"text":"...","illustration":"..."},{"pageNum":2,"text":"...","illustration":"..."},{"pageNum":3,"text":"...","illustration":"..."},{"pageNum":4,"text":"...","illustration":"..."},{"pageNum":5,"text":"...","illustration":"..."},{"pageNum":6,"text":"...","illustration":"..."}]}

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

AGE BAND VOICE GUIDE:
If age_band = "1-3" (Toddler): 1-2 short sentences per page. Vocabulary a 2-year-old recognizes. Heavy sound words: whoosh!, boom!, yay!, zoom! Lots of repetition and rhythm. Total ~40-80 words.
If age_band = "4-6" (Pre-K): 3-5 sentences per page. Simple emotions named directly: brave, nervous, proud, happy. Short dialogue and sound words welcome. Active verbs. Total ~200-300 words.
If age_band = "7-9" (Early Reader): 5-6 sentences per page. Varied sentence structure. Light internal thoughts. More nuanced emotions: doubt, determination, hope, relief. Light sensory detail. Total ~300-400 words.
If age_band = "10-12" (Middle Grade): 6-8 sentences per page. Richer interior life. Light metaphor and sensory writing. Subtle foreshadowing, payoff later. Emotional complexity welcome. Total ~500-650 words.

STRUCTURE OF THE SIX PAGES (universal):
- Page 1: Opening — introduce the child in the world of the adventure. Establish the dream/goal.
- Page 2: The journey begins. First action, first taste of the adventure.
- Page 3: A challenge appears. Stakes rise.
- Page 4: The low moment. Doubt, difficulty, or the biggest obstacle.
- Page 5: The breakthrough. The child overcomes through their own courage/kindness/cleverness.
- Page 6: Triumph and warmth. The reward, the celebration, and a quiet emotional beat for the keepsake.

TITLE RULE:
- The book title should include the child's name and feel like a real picture book title.
- Examples: "Lily's Brave Penalty Kick", "Theo and the Lonely Dragon", "Aria's Deep Blue Secret"
- Avoid generic titles like "The Adventure" or "A Magical Day"

SUBTITLE RULE:
- 3-6 words evoking the category emotion.
- Examples: "A World Cup Story", "A Fairy-Tale Friendship", "An Ocean Adventure"
- Put this in the "dedication" field as a companion to the warm dedication line — format: "For [Name], [warm line]. [Subtitle]."

ILLUSTRATION RULE (this is what makes the picture match the words):
- For each page, the "illustration" must depict the SAME moment the page text describes — same action, same setting, same emotion. If the text says the child is kneeling over a broken generator at dusk, the illustration describes exactly that.
- Describe it as a single, concrete visual: what the child is physically doing, their expression, the key objects around them, and the setting/time of day. One vivid sentence, 15-30 words.
- Centre the child performing the page's action. Name the one or two scene elements that anchor this beat (the float, the rope bridge, the glowing portal) so consecutive pages look distinct from each other.
- Do NOT include art-style words, camera directions, lighting, "Pixar", "3D", or the child's name — only the literal content of the scene. Styling is added later.
- Keep it physically consistent with the story_arc beat for that page.

FINAL CHECK BEFORE RETURNING:
- All 6 pages written, each with a matching illustration? ✓
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
