"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

const THEMES = [
  { id: "adventure",  emoji: "🌋", title: "The Big Adventure", subtitle: "Quest & Exploration",  desc: "Your child discovers a hidden world and must be brave to save the day", popular: true },
  { id: "dragon",     emoji: "🐉", title: "Dragon Tamer",      subtitle: "Fantasy & Magic",       desc: "A magical creature needs help and only your child has what it takes" },
  { id: "space",      emoji: "🚀", title: "To The Stars",      subtitle: "Space & Science",        desc: "Your child blasts off into the cosmos on a mission to save the universe" },
  { id: "ocean",      emoji: "🌊", title: "Deep Blue",          subtitle: "Ocean & Nature",         desc: "An underwater mystery only your child can solve" },
  { id: "jungle",     emoji: "🦁", title: "Jungle Crown",       subtitle: "Animals & Wildlife",     desc: "Your child becomes ruler of the animal kingdom for a day" },
  { id: "superpower", emoji: "🏆", title: "My Superpower",      subtitle: "Real Life Heroes",       desc: "Your child discovers their unique gift and uses it to help their community" },
];

const CHAPTER_NAMES = ["One", "Two", "Three", "Four", "Five", "Six"];

const TRAINING_MESSAGES = [
  "Studying your child's face...",
  "Learning their unique features...",
  "Capturing the sparkle in their eyes...",
  "Teaching the AI their smile...",
  "Perfecting every little detail...",
  "Adding the finishing touches to their look...",
  "Almost there — magic takes a moment...",
  "Making sure every illustration looks just right...",
  "Bringing your child to life on the page...",
  "Getting the character just perfect...",
  "Nearly ready — good things take time...",
  "One moment — weaving a little magic...",
];

const THEME_CLOSING: Record<string, (name: string) => string> = {
  adventure:  (n) => `Remember, ${n}: every great adventure begins with one brave step. The world is full of magic — and you have everything it takes to find it.`,
  dragon:     (n) => `${n}, you showed the world that kindness is the greatest power of all. Even the most fearsome things become friends when met with a gentle heart.`,
  space:      (n) => `Reach for the stars, ${n} — because you already proved that one small, brave explorer is all it takes to light up the universe.`,
  ocean:      (n) => `The ocean is deep and full of mystery — but so is your courage, ${n}. Never stop diving deeper into the wonder of the world.`,
  jungle:     (n) => `You are the ruler of your own kingdom, ${n}. Lead with kindness, speak with courage, and the world will always follow.`,
  superpower: (n) => `Your superpower is real, ${n}. It lives inside you every single day. The world is a brighter, better place because you are in it.`,
};

const HAIR_COLORS = [
  { id: "blonde",      label: "Blonde",      hex: "#E8C76B" },
  { id: "brown",       label: "Brown",       hex: "#8B5E3C" },
  { id: "dark-brown",  label: "Dark Brown",  hex: "#3B1F0E" },
  { id: "black",       label: "Black",       hex: "#1A1A1A" },
  { id: "red",         label: "Red",         hex: "#C0392B" },
  { id: "auburn",      label: "Auburn",      hex: "#922B21" },
  { id: "gray",        label: "White/Gray",  hex: "#C8C8C8" },
];

const EYE_COLORS = [
  { id: "brown",       label: "Brown",       hex: "#7B4A3A" },
  { id: "dark-brown",  label: "Dark Brown",  hex: "#3E2207" },
  { id: "blue",        label: "Blue",        hex: "#4A90D9" },
  { id: "green",       label: "Green",       hex: "#3A7D44" },
  { id: "hazel",       label: "Hazel",       hex: "#8E7B5D" },
  { id: "gray",        label: "Gray",        hex: "#8A9BA8" },
];

const PAGE_BACKGROUNDS = [
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

const TOTAL_STEPS     = 5;

// LoRA uses trigger word TOK — all prompts must start with "a photo of TOK"
const CLOTHING = " Fully dressed at all times in age-appropriate adventure clothing — long-sleeved top, full-length trousers or skirt, shoes or boots. No bare skin visible below the neckline or above the wrist. No logos, no brand names, no text, no character prints, no emblems on clothing.";

// Reusable style token — prepended to every page prompt for visual consistency across all 6 pages
// Prepended to every scene prompt — style anchor must stay identical across all 6 pages
const STYLE_ANCHOR =
  "Pixar-Disney 3D animated storybook illustration, stylized child character with large expressive eyes and soft rounded face, warm painted lighting, vibrant saturated colours, ";

const STYLE_TOKEN =
  "CAMERA: wide environmental shot, camera pulled back 3-4 metres, character shown from waist to head occupying NO MORE than 40% of the frame. " +
  "Environment and setting must fill the remaining 60% of the frame — sky, landscape, background scenery are as important as the character. " +
  "Never a portrait, never a close-up, never a face-filling shot, never a bust shot. " +
  "CHARACTER ANGLE: child faces the viewer at a three-quarter angle — face clearly visible, expressive, and engaged. Never a side profile, never facing fully away. " +
  "LIGHTING: warm golden-hour painted light, soft directional side lighting, glowing amber rim light wrapping the character. No flat lighting, no overcast. " +
  "MAGICAL LIGHT RULE: any glowing portals, orbs, crystals, or magical elements must cast warm amber or golden light — NOT cool blue, NOT white, NOT purple. Scene colour temperature stays warm regardless of magical light sources. " +
  "COLOUR: fully warm harmonized palette — golden amber, honey, soft orange, warm peach shadows. No cool blues, no cold grey tones, no blue-tinted scenes. " +
  "DEPTH: strong three-layer composition — detailed foreground elements, character in midground, expansive richly detailed background with atmospheric haze. No empty backgrounds. " +
  "STYLE: Pixar-Disney 3D animated film frame — stylized character design, slightly exaggerated expressive features, smooth soft rendering, no realistic skin pores or photographic texture. Humans AND animals rendered in the same Pixar animation aesthetic. Consistent character stylization across every page. Child as hero of their world. " +
  "No text, no words, no logos, no branded clothing.";

const SAFETY = "The child is completely and fully clothed in an age-appropriate adventure outfit at all times — long-sleeved top, full-length trousers or skirt, shoes. Absolutely no bare chest, no bare torso, no shirtless, no sleeveless, no exposed midriff, no bare arms or legs. Background contains only nature, animals, and magical storybook elements. Safe for young children.";

// Injects gender, age, and explicit clothing description into every prompt at generation time.
// This is the primary guard against wrong gender features and any exposed skin.
function buildGenderedPrompt(prompt: string, gender: string, age: number, hairColor?: string, eyeColor?: string): string {
  // Age-based body size descriptor
  const sizeHint =
    age <= 1  ? "tiny baby, infant, barely walking, very small toddler body, " :
    age <= 2  ? "tiny toddler, very small young child body, " :
    age <= 4  ? "small preschooler, small young child body, " :
    age <= 7  ? "young child, small child body, " :
    age <= 10 ? "older child, " : "";

  const hairHint = hairColor ? `${hairColor.replace(/-/g, " ")} hair, ` : "";
  const eyeHint  = eyeColor  ? `${eyeColor.replace(/-/g, " ")} eyes, `  : "";

  const hint =
    gender === "boy"
      ? `${age}-year-old boy, ${sizeHint}short hair, masculine features, ${hairHint}${eyeHint}fully dressed in long-sleeved adventure top and full-length trousers and boots, `
      : gender === "girl"
      ? `${age}-year-old girl, ${sizeHint}feminine features, long hair, ${hairHint}${eyeHint}fully dressed in long-sleeved adventure top and full-length skirt or trousers and boots, `
      : `${age}-year-old child, ${sizeHint}${hairHint}${eyeHint}fully dressed in long-sleeved adventure outfit and full-length trousers and boots, `;
  // Prepend style anchor immediately after TOK trigger for maximum influence
  return prompt.replace("a photo of TOK,", `a photo of TOK, ${STYLE_ANCHOR}${hint}`);
}

const COVER_PROMPT =
  "a photo of TOK, close-up 3/4 portrait caught mid-laugh with large sparkling expressive eyes and a huge joyful smile, " +
  "leaning slightly forward with energy and excitement, " +
  "magical glowing portal swirling with golden light in the background, " +
  "warm dramatic rim lighting, face fully illuminated, " +
  "Disney Pixar 3D animated film style, smooth stylized character design, vivid saturated colours, no text anywhere." + CLOTHING;

const SCENE_PROMPTS_BY_THEME: Record<string, string[]> = {
  adventure: [
    "a photo of TOK, leaning excitedly forward with one arm outstretched and fingers spread, " +
    "reaching toward a swirling magical stone archway portal glowing with golden sparkles, " +
    "one foot lifted mid-step, mouth open in amazement, golden sparkles landing on their hand, " +
    "magical garden at golden hour, fireflies swirling all around. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, spinning with arms spread wide and head tilted back laughing with delight, " +
    "caught mid-spin with hair and clothes in motion, surrounded by enormous glowing enchanted trees, " +
    "bioluminescent mushrooms below, fireflies and magical particles swirling all around. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, kneeling in a field of tall grass with both arms raised high and fingers spread, " +
    "reaching up toward a single enormous glowing star falling from the night sky, " +
    "head tilted back, eyes wide, shooting comets and stars everywhere above, " +
    "pine tree silhouettes on the horizon. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, crouching very low to the ground with one hand gently extended palm-up " +
    "toward a tiny glowing creature peeking out from under a mossy rock, " +
    "face close to the ground, expression soft and caring, " +
    "giant colourful mushrooms towering above, magical dappled forest light filtering through trees. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, leaping upward with both arms raised high above their head holding a glowing rainbow crystal, " +
    "caught at the peak of a joyful jump, face lit up with triumph, " +
    "brilliant rainbow light beams exploding outward from the crystal in all directions, " +
    "dark magical forest clearing at night below. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, dancing and spinning with arms raised in pure joy, " +
    "caught mid-spin with a huge laugh, hair and clothes swirling with motion, " +
    "joyful glowing rabbits, deer and fireflies dancing all around, " +
    "warm golden magical light flooding the scene, stars and tree canopy above. " + STYLE_TOKEN + " " + SAFETY,
  ],

  dragon: [
    "a photo of TOK, crouching low with one hand gently extended palm-up toward a tiny shy baby dragon " +
    "peeking around a mossy boulder, the dragon's eyes glowing soft amber, " +
    "misty magical forest clearing at dusk, golden light filtering through ancient trees. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, standing with arms spread wide laughing with delight as a friendly young dragon " +
    "playfully blows a tiny puff of colourful smoke rings around them, " +
    "both caught in a moment of pure joy together, sunny mountain meadow behind them. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, climbing with excitement onto the back of a large friendly dragon, " +
    "one hand gripping a neck spike, one foot lifted mid-climb, huge grin on their face, " +
    "the dragon turning its head with a warm expression, misty mountain peaks below. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, riding on the back of a soaring dragon high above the clouds, " +
    "arms thrown wide open in pure exhilaration, hair and clothes streaming in the wind, " +
    "enormous white clouds and a golden sunset all around them, tiny villages far below. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, standing side by side with a dragon facing a dark storm cloud, " +
    "one arm raised high and pointing forward with determined courage, " +
    "the dragon rearing up beside them with glowing wings spread wide, lightning crackling behind. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, dancing and laughing in a meadow as a dragon breathes spectacular rainbow fire " +
    "in a great arc overhead, colourful sparks and glowing embers raining down like confetti, " +
    "other friendly dragons watching and cheering from the hillside behind. " + STYLE_TOKEN + " " + SAFETY,
  ],

  space: [
    "a photo of TOK, sitting in a rocket cockpit pressing a glowing red launch button with both hands, " +
    "face lit with excitement and anticipation, instrument panels glowing all around, " +
    "through the cockpit window a star-filled sky and the curve of Earth below. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, floating weightless inside a space station, arms spread wide laughing with delight, " +
    "hair floating upward in zero gravity, spinning slowly with a huge grin, " +
    "Earth visible through a large circular porthole behind them, stars stretching to infinity. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, in a spacesuit floating outside the spacecraft, one arm outstretched pointing " +
    "toward a spectacular glowing planet with colourful rings directly ahead, " +
    "mouth open in amazement, the Milky Way a brilliant band of light behind them. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, face to face with small friendly glowing alien creatures floating in space, " +
    "both hands extended gently toward them, the aliens reaching back curiously with tiny glowing fingers, " +
    "a swirling purple and gold nebula filling the background sky. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, both arms raised high reaching toward fading stars that burst back to brilliant life " +
    "wherever their hands touch, golden light radiating outward from each fingertip, " +
    "the dark galaxy transforming into a field of blazing stars all around them. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, floating peacefully back toward Earth in a spacesuit, arms open wide, " +
    "smiling with quiet pride, a spectacular newly-lit galaxy of warm golden stars stretching " +
    "in every direction behind them, Earth glowing blue and beautiful far below. " + STYLE_TOKEN + " " + SAFETY,
  ],

  ocean: [
    "a photo of TOK, standing on the edge of a sun-drenched coral reef rock, " +
    "arms raised overhead ready to leap into crystal-clear glowing turquoise water below, " +
    "tropical fish visible beneath the surface, golden sunlight sparkling everywhere. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, floating underwater surrounded by a swirling school of brilliant tropical fish, " +
    "arms spread wide with wonder, hair flowing gently upward, " +
    "towering colourful coral formations all around, shafts of sunlight piercing the water from above. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, face to face underwater with a giant friendly sea turtle, " +
    "both hands gently resting on its ancient shell, smiling in amazement, " +
    "glowing bioluminescent jellyfish floating peacefully around them in the deep blue water. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, swimming toward a glowing underwater cave entrance, " +
    "one arm outstretched reaching for a softly pulsing golden treasure chest at the cave mouth, " +
    "magical light streaming from inside, colourful sea creatures peeking out curiously from the rocks. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, gently unwrapping seaweed from a baby dolphin caught in the shallows, " +
    "kneeling in the warm water with careful focused hands, the dolphin looking up with soft grateful eyes, " +
    "golden sunset light turning the water to liquid amber and rose. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, riding joyfully on the back of a leaping dolphin through sparkling ocean waves, " +
    "arms thrown wide open and laughing with pure delight, " +
    "other dolphins leaping alongside them, a brilliant rainbow arching over a golden sunset sky. " + STYLE_TOKEN + " " + SAFETY,
  ],

  jungle: [
    "a photo of TOK, stepping with wide-eyed wonder beneath a towering jungle archway of twisted roots " +
    "and enormous tropical leaves, colourful parrots and tiny monkeys watching curiously from the branches, " +
    "shafts of golden light cutting through the canopy above, flowers blooming everywhere. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, standing with arms spread wide as a dozen brightly-coloured tropical birds " +
    "land on their outstretched arms and shoulders, laughing with delight, " +
    "playful monkeys hanging from the branches all around, a waterfall glowing in the background. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, kneeling as a procession of animals — lions, elephants, deer — bow their heads " +
    "respectfully before them in a sun-dappled jungle clearing, " +
    "a monkey carefully placing a crown of tropical flowers on their head. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, standing proudly on a mossy rock in the heart of the jungle with arms raised high, " +
    "surveying their animal kingdom below — elephants, zebras, and parrots gathered in the clearing, " +
    "golden afternoon light flooding the scene through a break in the canopy. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, carefully freeing a small bird whose wing is caught in a vine, " +
    "kneeling with gentle focused hands, the tiny bird looking up trustingly, " +
    "surrounding animals watching in respectful silence, soft dappled forest light all around. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, dancing in the middle of a jungle celebration, animals dancing all around them, " +
    "elephants swaying, monkeys clapping, parrots swooping overhead in circles, " +
    "the entire jungle alive with warm golden light, fireflies and flower petals raining down. " + STYLE_TOKEN + " " + SAFETY,
  ],

  superpower: [
    "a photo of TOK, staring in amazement at their own hands as they begin to glow with warm golden light, " +
    "tiny sparks floating up from their fingertips, eyes wide with wonder and discovery, " +
    "standing in a sunlit park, golden bokeh light swirling around them. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, arms outstretched with golden light radiating from their hands, " +
    "catching a stack of tumbling books in mid-air and holding them suspended with a focused expression, " +
    "a child in the background watching in amazement, bright school hallway setting. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, standing in the centre of a playground with golden light beaming from their palms, " +
    "fixing a broken swing that glows and becomes new again, laughing children looking on in wonder, " +
    "warm golden afternoon light flooding the scene. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, facing a dark storm cloud with one arm raised, expression fierce and determined, " +
    "golden light from their hand pushing the storm back, sunlight breaking through around them, " +
    "townsfolk watching from behind with hopeful expressions. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, standing tall with arms raised high, a spectacular burst of golden light " +
    "exploding outward from their whole body in all directions, " +
    "flowers blooming instantly around their feet, birds taking flight from the golden shockwave. " + STYLE_TOKEN + " " + SAFETY,

    "a photo of TOK, standing humbly and smiling as neighbours and friends cheer and applaud all around, " +
    "golden sparkles still floating gently from their hands, sunflowers blooming at their feet, " +
    "a warm sunny street celebration with banners and balloons in every direction. " + STYLE_TOKEN + " " + SAFETY,
  ],
};

const PAYMENTS_ENABLED = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const DEMO_STORY = {
  title: "Aria Saves the Universe",
  dedication: "For Aria, the bravest explorer in the cosmos",
  pages: [
    { pageNum: 1, text: "Once upon a time, Aria gazed up at the night sky and noticed something strange — the stars were going out, one by one.", illustration: "A young girl standing in her backyard at night, looking up at a dimming starry sky with wonder and determination" },
    { pageNum: 2, text: "'Mission Control needs our best astronaut!' Aria buckled her helmet, pressed the launch button, and WHOOOOSH — she blasted off!", illustration: "A brave young girl in a spacesuit launching into space aboard a gleaming silver rocket, leaving a trail of golden light" },
    { pageNum: 3, text: "In the heart of Galaxy 7, Aria discovered tiny star creatures whose home had gone cold and dark.", illustration: "A girl floating in deep space surrounded by small glowing star creatures looking sad, a dark galaxy behind them" },
    { pageNum: 4, text: "Aria had an idea! She shared her warmth with each little star — and one by one, they began to glow again.", illustration: "A girl in a spacesuit reaching out to touch star creatures that light up and sparkle with joy one by one" },
    { pageNum: 5, text: "The creatures cheered! Together they reignited every star in the galaxy, filling the sky with dazzling, magical light.", illustration: "A girl and star creatures celebrating as the entire galaxy lights up in brilliant colours around them" },
    { pageNum: 6, text: "Aria floated home beneath a million shining stars. 'Best adventure ever,' she whispered, smiling all the way.", illustration: "A girl in a spacesuit floating peacefully back toward Earth through a spectacular starry galaxy full of warm golden light" },
  ],
};
const DEMO_IMAGES: string[] = [
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
  "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800",
];
const DEMO_COVER = "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800";

const encodeShare = (data: object) => {
  const json = JSON.stringify(data);
  const b64  = btoa(unescape(encodeURIComponent(json)));
  // URL-safe base64: replace chars that break query strings
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};
const decodeShare = (s: string) => {
  // Restore standard base64 from URL-safe form
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad  = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  return JSON.parse(decodeURIComponent(escape(atob(b64 + pad))));
};
const rawFalUrl   = (proxyUrl: string) => {
  try { return decodeURIComponent(proxyUrl.replace("/api/proxy?url=", "")); }
  catch { return proxyUrl; }
};

// GA4 helper
const gtagEvent = (event: string, params?: object) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", event, params);
  }
};

export default function StorybookCreator() {
  // ── Flow state ───────────────────────────────────────────────────────────────
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [stepDir,  setStepDir]  = useState<"fwd" | "back">("fwd");
  const [mainStep, setMainStep] = useState<"onboarding" | "generating" | "book">("onboarding");

  // ── Photos (1–2) ─────────────────────────────────────────────────────────────
  const [photos,       setPhotos]       = useState<string[]>([]);   // object URLs for display
  const [photosBase64, setPhotosBase64] = useState<string[]>([]);   // compressed base64
  const [loraUrl,      setLoraUrl]      = useState<string | null>(null); // trained LoRA weights URL
  const [dragOver,     setDragOver]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Appearance ───────────────────────────────────────────────────────────────
  const [hairColor, setHairColor] = useState("brown");
  const [eyeColor,  setEyeColor]  = useState("brown");


  // ── Form ─────────────────────────────────────────────────────────────────────
  const [childName,   setChildName]   = useState("");
  const [childAge,    setChildAge]    = useState(5);
  const [childGender, setChildGender] = useState<"boy" | "girl" | "neutral">("boy");
  const [theme,       setTheme]       = useState("adventure");

  // ── Preview (step 5) ─────────────────────────────────────────────────────────
  const [previewStory,   setPreviewStory]   = useState<any>(null);
  const [previewImages,  setPreviewImages]  = useState<(string | null)[]>(Array(6).fill(null));
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(null);
  const [previewStatus,  setPreviewStatus]  = useState<"idle" | "loading" | "done">("idle");
  const [previewMsg,     setPreviewMsg]     = useState("Writing your story...");
  const [previewDone,    setPreviewDone]    = useState(0); // scenes completed count (out of 7)
  const [trainingFailed, setTrainingFailed] = useState(false);
  const [retryingScenes, setRetryingScenes] = useState(false);
  const previewStarted = useRef(false);

  // ── Full book ─────────────────────────────────────────────────────────────────
  const [story,           setStory]           = useState<any>(null);
  const [coverImageUrl,   setCoverImageUrl]   = useState<string | null>(null);
  const [pageImages,      setPageImages]      = useState<(string | null)[]>(Array(6).fill(null));
  const [scenesCompleted, setScenesCompleted] = useState(0);
  const [currentPage,     setCurrentPage]     = useState(-2);
  const [navDir,          setNavDir]          = useState<"fwd" | "back">("fwd");

  // ── UI ────────────────────────────────────────────────────────────────────────
  const [falError,         setFalError]         = useState<string | null>(null);
  const [loadingMsg,       setLoadingMsg]       = useState("");
  const [checkoutLoading,  setCheckoutLoading]  = useState<string | null>(null);
  const [pdfLoading,       setPdfLoading]       = useState(false); // kept for compat
  const [regeneratingPage, setRegeneratingPage] = useState<number | null>(null);
  const [shareCopied,      setShareCopied]      = useState(false);
  const [isMobile,         setIsMobile]         = useState(false);
  const [tabHidden,        setTabHidden]        = useState(false); // user backgrounded the tab during generation
  const wakeLockRef = useRef<any>(null);
  const [printOrdered,     setPrintOrdered]     = useState(false);
  const [printOrderError,  setPrintOrderError]  = useState<string | null>(null);
  const [printFulfilling,  setPrintFulfilling]  = useState(false);
  const printFulfilledRef = useRef(false);
  const [pendingPrintSession, setPendingPrintSession] = useState<string | null>(null);
  const [isSharedView,     setIsSharedView]     = useState(false);
  const [isDemo,           setIsDemo]           = useState(false);
  const [showNewBookConfirm, setShowNewBookConfirm] = useState(false);
  const [kontextResults,   setKontextResults]   = useState<{ scene: string; url: string }[] | "error" | null>(null);
  const [kontextLoading,   setKontextLoading]   = useState(false);
  const [kontextImageUrl,  setKontextImageUrl]  = useState("");

  // ── Email lead capture ────────────────────────────────────────────────────────
  const [leadEmail,    setLeadEmail]    = useState("");
  const [leadSent,     setLeadSent]     = useState(false);
  const [leadSending,  setLeadSending]  = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 680);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Wake Lock: keep screen on during generation (Chrome Android) ─────────────
  const acquireWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch {}
  };
  const releaseWakeLock = () => {
    try { wakeLockRef.current?.release(); wakeLockRef.current = null; } catch {}
  };

  // ── Visibility change: warn user if they background during generation ────────
  useEffect(() => {
    const onVisibility = () => {
      const isGenerating = previewStatus === "loading" || (mainStep === "book" && scenesCompleted < 6);
      if (document.hidden && isGenerating) setTabHidden(true);
      if (!document.hidden) setTabHidden(false);
      // Re-acquire wake lock when tab comes back (it auto-releases on hide)
      if (!document.hidden && isGenerating) acquireWakeLock();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [previewStatus, mainStep, scenesCompleted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore LoRA URL from a previous session (valid for 6 hours)
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem("sb_lora_url");
      const savedTs  = localStorage.getItem("sb_lora_ts");
      if (savedUrl && savedTs && (Date.now() - Number(savedTs)) < 6 * 3600 * 1000) {
        setLoraUrl(savedUrl);
      } else if (savedUrl) {
        localStorage.removeItem("sb_lora_url");
        localStorage.removeItem("sb_lora_ts");
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stripe return + share link ────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.history.replaceState({}, "", "/create");

    // Demo mode: ?demo=true — loads a mock book instantly, no API calls
    if (params.get("demo") === "true") {
      setChildName("Aria");
      setChildAge(5);
      setChildGender("girl");
      setTheme("space");
      setStory(DEMO_STORY);
      setPageImages(DEMO_IMAGES);
      setCoverImageUrl(DEMO_COVER);
      setCurrentPage(-2);
      setMainStep("book");
      setIsDemo(true);
      return;
    }

    const share = params.get("share");
    if (share) {
      try {
        const data = decodeShare(share);
        setStory(data.story);
        if (data.coverFalUrl) setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(data.coverFalUrl)}`);
        setPageImages((data.pageFalUrls || []).map((u: string | null) =>
          u ? `/api/proxy?url=${encodeURIComponent(u)}` : null
        ));
        setIsSharedView(true); setCurrentPage(-2); setMainStep("book");
      } catch (e) { console.error("Invalid share link", e); }
      return;
    }

    const success   = params.get("success");
    const sessionId = params.get("session_id");
    const ref       = params.get("ref");
    if (success && sessionId && ref) {
      const saved = sessionStorage.getItem(ref);
      if (!saved) return;
      sessionStorage.removeItem(ref);
      const data = JSON.parse(saved);
      const plan = params.get("plan");
      fetch(`/api/verify-session?session_id=${sessionId}`)
        .then(r => r.json())
        .then(result => {
          if (!result.ok) return;
          setChildName(data.childName || ""); setChildAge(data.childAge ?? 5);
          setChildGender(data.childGender || "boy"); setTheme(data.theme || "adventure");
          setHairColor(data.hairColor || "brown"); setEyeColor(data.eyeColor || "brown");
          if (data.photosBase64?.length) setPhotosBase64(data.photosBase64);
          if (data.coverFalUrl) setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(data.coverFalUrl)}`);
          if (plan === "print") setPendingPrintSession(sessionId);
          setTimeout(() => generateFullBook(data), 50);
        }).catch(console.error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Image helpers ─────────────────────────────────────────────────────────────
  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1024; let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
      };
      img.onerror = reject; img.src = objectUrl;
    });

  const addPhoto = useCallback((file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotos(prev => {
      if (prev.length >= 2) return prev;
      return [...prev, URL.createObjectURL(file)];
    });
    compressImage(file)
      .then(b64 => {
        setPhotosBase64(prev => prev.length >= 2 ? prev : [...prev, b64]);
        gtagEvent("photo_uploaded");
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const b64 = (e.target?.result as string).split(",")[1];
          setPhotosBase64(prev => prev.length >= 2 ? prev : [...prev, b64]);
        };
        reader.readAsDataURL(file);
      });
  }, []);

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotosBase64(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) addPhoto(file);
  };



  // ── Fallback story ────────────────────────────────────────────────────────────
  const getFallbackStory = (name: string) => ({
    title: `${name || "A Child"}'s Big Adventure`,
    dedication: `For ${name || "every child"} who dares to dream`,
    pages: [
      { pageNum: 1, text: `Once upon a time, ${name || "our hero"} woke up to find a magical map under their pillow.`, illustration: `A cozy bedroom at dawn, the child sitting up in bed holding a glowing treasure map` },
      { pageNum: 2, text: `${name || "Our hero"} packed a backpack and set off into the forest. "I'm ready!" they cheered.`, illustration: `A child in explorer gear at the edge of a glowing enchanted forest at golden hour` },
      { pageNum: 3, text: `The path led through an enchanted forest full of friendly butterflies and glowing flowers.`, illustration: `Inside a magical glowing forest, the child walking along a winding path with giant luminous mushrooms` },
      { pageNum: 4, text: `Deep in the forest they found a tiny dragon who had lost his fire.`, illustration: `A clearing in the enchanted forest, the child kneeling beside a small sad blue dragon` },
      { pageNum: 5, text: `${name || "Our hero"} told a joke and WHOOOOSH bright flames burst out! "You fixed me!" the dragon cried.`, illustration: `The child and a small dragon, the dragon joyfully breathing a spectacular rainbow flame into the sky` },
      { pageNum: 6, text: `The dragon flew them home under the stars. "Best day ever," they whispered.`, illustration: `A child riding on the back of a friendly glowing dragon soaring through a star-filled night sky` },
    ],
  });

  const generatePreview = useCallback(async () => {
    setPreviewStatus("loading");
    setPreviewMsg("Writing your story...");
    setPreviewDone(0);
    setPreviewImages(Array(6).fill(null));
    acquireWakeLock();
    setPreviewCoverUrl(null);
    setLoraUrl(null);

    const selectedTheme = THEMES.find(t => t.id === theme);

    try {
      // Story + LoRA training in parallel (both independent — saves 5-10s)
      setPreviewMsg("Writing your story & training your character...");
      const [storyRes, trainRes] = await Promise.all([
        fetch("/api/story", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childName, childAge: String(childAge), gender: childGender, hairColor, eyeColor,
            theme: `${selectedTheme?.title} - ${selectedTheme?.subtitle}: ${selectedTheme?.desc}`,
          }),
        }).then(r => r.json()),
        photosBase64.length > 0
          ? fetch("/api/train-lora", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photosBase64 }),
            }).then(r => r.json())
          : Promise.resolve(null),
      ]);

      if (storyRes?.error === "limit_reached") {
        setPreviewMsg("Preview limit reached — please purchase to continue.");
        setPreviewStatus("done");
        releaseWakeLock();
        setPreviewStory({ title: "", dedication: "", pages: [], _limitReached: true });
        return;
      }
      const storyData = storyRes?.pages ? storyRes : getFallbackStory(childName);
      setPreviewStory(storyData);

      // ── Poll for LoRA completion ───────────────────────────────────────────────
      let trainedLoraUrl: string | null = null;
      if (trainRes?.jobId) {
        // Poll until complete (max 5 min, 5s intervals)
        let attempts = 0;
        let trainJobFailed = false;
        while (!trainedLoraUrl && attempts < 60) {
          await new Promise<void>(resolve => setTimeout(resolve, 5000));
          attempts++;
          try {
            const checkRes = await fetch("/api/check-lora", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobId: trainRes.jobId }),
            }).then(r => r.json());
            if (checkRes.status === "COMPLETED" && checkRes.loraUrl) {
              trainedLoraUrl = checkRes.loraUrl;
            } else if (checkRes.status === "FAILED") {
              trainJobFailed = true;
              break;
            }
          } catch {}
          if (!trainedLoraUrl) {
            setPreviewMsg(TRAINING_MESSAGES[attempts % TRAINING_MESSAGES.length]);
          }
        }
        if (trainedLoraUrl) {
          setLoraUrl(trainedLoraUrl);
          try {
            localStorage.setItem("sb_lora_url", trainedLoraUrl);
            localStorage.setItem("sb_lora_ts", String(Date.now()));
          } catch {}
        } else {
          // Training failed or timed out — flag it so the UI can explain
          setTrainingFailed(true);
          const reason = trainJobFailed ? "Character training failed" : "Character training timed out";
          setPreviewMsg(`${reason} — your story is ready but without personalised illustrations.`);
        }
      }

      setPreviewMsg("Illustrating your scenes...");

      if (trainedLoraUrl && storyData.pages) {
        let done = 0;
        const total = 7; // 1 cover + 6 pages
        const themePrompts = SCENE_PROMPTS_BY_THEME[theme] ?? SCENE_PROMPTS_BY_THEME.adventure;

        const bookSeed = Math.floor(Math.random() * 2_147_483_647);

        const callScene = async (prompt: string) => {
          const res = await fetch("/api/generate-scene", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loraUrl: trainedLoraUrl, prompt: buildGenderedPrompt(prompt, childGender, childAge, hairColor, eyeColor), seed: bookSeed }),
          }).then(r => r.json());
          return res;
        };

        const handleScene = async (prompt: string, idx: number) => {
          let url: string | null = null;
          try {
            const res = await callScene(prompt);
            url = res.url ?? null;
            if (!url) url = (await callScene(prompt)).url ?? null;
          } catch {
            try { url = (await callScene(prompt)).url ?? null; } catch {}
          }
          if (idx === -1) {
            if (url) setPreviewCoverUrl(`/api/proxy?url=${encodeURIComponent(url)}`);
          } else {
            setPreviewImages(prev => {
              const n = [...prev];
              n[idx] = url ? `/api/proxy?url=${encodeURIComponent(url)}` : "__failed__";
              return n;
            });
          }
          done++;
          setPreviewDone(done);
          setPreviewMsg(done < total ? `${done} of ${total} scenes ready...` : "All illustrations ready!");
        };

        // Build prompts from Claude's illustration descriptions + story text as context
        const storyScenePrompts = (storyData.pages || []).map((pg: any) =>
          pg.illustration
            ? `a photo of TOK, ${pg.illustration} Scene context: ${(pg.text || "").substring(0, 120)} ${STYLE_TOKEN} ${SAFETY}`
            : themePrompts[0]
        );

        // All 7 scenes in parallel — cover + 6 story scenes
        await Promise.all([
          handleScene(COVER_PROMPT, -1),
          ...storyScenePrompts.map((p: string, idx: number) => handleScene(p, idx)),
        ]);
      }
    } catch { setPreviewStory(getFallbackStory(childName)); }

    setPreviewStatus("done");
    releaseWakeLock();
    gtagEvent("book_generated", { theme, childAge });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, childName, childAge, childGender, hairColor, eyeColor, photosBase64]);

  useEffect(() => {
    if (onboardingStep === 5 && !previewStarted.current) {
      previewStarted.current = true;
      generatePreview();
    }
  }, [onboardingStep, generatePreview]);

  // Retry scenes that failed in the preview
  const retryFailedPreviewScenes = useCallback(async () => {
    if (!loraUrl || retryingScenes) return;
    const failedIdxs = previewImages.map((img, i) => img === "__failed__" ? i : -1).filter(i => i >= 0);
    if (failedIdxs.length === 0) return;
    setRetryingScenes(true);
    const themePrompts = SCENE_PROMPTS_BY_THEME[theme] ?? SCENE_PROMPTS_BY_THEME.adventure;
    for (const idx of failedIdxs) {
      try {
        const res = await fetch("/api/generate-scene", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loraUrl, prompt: buildGenderedPrompt(themePrompts[idx], childGender, childAge, hairColor, eyeColor) }),
        }).then(r => r.json());
        if (res.url) {
          setPreviewImages(prev => {
            const n = [...prev];
            n[idx] = `/api/proxy?url=${encodeURIComponent(res.url)}`;
            return n;
          });
        }
      } catch {}
    }
    setRetryingScenes(false);
  }, [loraUrl, previewImages, childGender, childAge, retryingScenes]);

  // ── Full book generation (post-purchase) ─────────────────────────────────────
  const generateFullBook = async (savedData?: any) => {
    const _name          = savedData?.childName     ?? childName;
    const _age           = savedData?.childAge      ?? childAge;
    const _gender        = savedData?.childGender   ?? childGender;
    const _theme         = savedData?.theme         ?? theme;
    const _hair          = savedData?.hairColor     ?? hairColor;
    const _eye           = savedData?.eyeColor      ?? eyeColor;
    const _savedStory    = savedData?.story         ?? previewStory;
    const _savedFalUrls  = savedData?.previewFalUrls as (string | null)[] | undefined;
    const _savedCoverUrl = savedData?.coverFalUrl   as string | undefined;
    const _photosBase64  = (savedData?.photosBase64 as string[] | undefined) ?? photosBase64;
    const _loraUrl       = savedData?.loraUrl  ?? loraUrl;

    // Restore cover if it came back from Stripe session
    if (_savedCoverUrl) setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(_savedCoverUrl)}`);

    // Fast path: all scenes + cover already generated in preview
    if (_savedStory && _savedFalUrls && _savedFalUrls.filter(Boolean).length === 6) {
      setStory(_savedStory);
      setPageImages(_savedFalUrls.map(u => u ? `/api/proxy?url=${encodeURIComponent(u)}` : null));
      setCurrentPage(-2); setMainStep("book"); return;
    }

    // If preview images exist in state, reuse them (including cover)
    const existingImages = previewImages.filter(Boolean).length === 6 ? previewImages : null;
    if (_savedStory && existingImages) {
      setStory(_savedStory); setPageImages(existingImages);
      if (previewCoverUrl) setCoverImageUrl(previewCoverUrl);
      setCurrentPage(-2); setMainStep("book"); return;
    }

    // Full generation from scratch
    setMainStep("generating"); setFalError(null);
    setPageImages(Array(6).fill(null)); setCoverImageUrl(null); setScenesCompleted(0); setIsSharedView(false);

    try {
      let storyData = _savedStory;

      if (!storyData) {
        const sel = THEMES.find(t => t.id === _theme);
        setLoadingMsg("Writing your story...");
        const res = await fetch("/api/story", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childName: _name, childAge: String(_age), gender: _gender, hairColor: _hair, eyeColor: _eye, theme: `${sel?.title} - ${sel?.subtitle}` }),
        }).then(r => r.json());
        storyData = res?.pages ? res : getFallbackStory(_name);
      }

      setStory(storyData);

      // Re-train LoRA if we have photos but no loraUrl (e.g. training failed before purchase)
      let activeLoraUrl = _loraUrl;
      if (_photosBase64.length > 0 && !activeLoraUrl && storyData?.pages) {
        setLoadingMsg("Training your character... (~2-3 min)");
        const trainRes = await fetch("/api/train-lora", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photosBase64: _photosBase64 }),
        }).then(r => r.json());
        if (trainRes.jobId) {
          let attempts = 0;
          while (!activeLoraUrl && attempts < 60) {
            await new Promise<void>(resolve => setTimeout(resolve, 5000));
            attempts++;
            try {
              const checkRes = await fetch("/api/check-lora", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobId: trainRes.jobId }),
              }).then(r => r.json());
              if (checkRes.status === "COMPLETED" && checkRes.loraUrl) {
                activeLoraUrl = checkRes.loraUrl;
                setLoraUrl(activeLoraUrl);
              } else if (checkRes.status === "FAILED") {
                break;
              }
            } catch {}
            if (!activeLoraUrl) setLoadingMsg(TRAINING_MESSAGES[attempts % TRAINING_MESSAGES.length]);
          }
        }
      }

      if (activeLoraUrl && storyData?.pages) {
        setLoadingMsg("Painting your illustrations... (~2 min)");

        const bookSeed2 = Math.floor(Math.random() * 2_147_483_647);

        const callScene2 = async (prompt: string) => {
          const res = await fetch("/api/generate-scene", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ loraUrl: activeLoraUrl, prompt: buildGenderedPrompt(prompt, _gender, _age, _hair, _eye), seed: bookSeed2 }),
          }).then(r => r.json());
          return res;
        };

        const fullThemePrompts = SCENE_PROMPTS_BY_THEME[_theme] ?? SCENE_PROMPTS_BY_THEME.adventure;
        const fullStoryPrompts = (storyData?.pages || []).map((pg: any) =>
          pg.illustration
            ? `a photo of TOK, ${pg.illustration} Scene context: ${(pg.text || "").substring(0, 120)} ${STYLE_TOKEN} ${SAFETY}`
            : fullThemePrompts[0]
        );

        const handleScene2 = async (prompt: string, idx: number) => {
          let url: string | null = null;
          try {
            const res = await callScene2(prompt);
            url = res.url ?? null;
            if (!url) url = (await callScene2(prompt)).url ?? null;
          } catch {
            try { url = (await callScene2(prompt)).url ?? null; } catch {}
          }
          if (idx === -1) {
            if (url) setCoverImageUrl(`/api/proxy?url=${encodeURIComponent(url)}`);
          } else {
            setPageImages(prev => {
              const n = [...prev];
              n[idx] = url ? `/api/proxy?url=${encodeURIComponent(url)}` : "__failed__";
              return n;
            });
          }
          setScenesCompleted(p => p + 1);
        };

        await Promise.all([
          handleScene2(COVER_PROMPT, -1),
          ...fullStoryPrompts.map((p: string, idx: number) => handleScene2(p, idx)),
        ]);
      }

      setCurrentPage(-2); setMainStep("book");
    } catch (err) {
      console.error(err);
      setStory(getFallbackStory(_name)); setCurrentPage(-2); setMainStep("book");
    }
  };

  // ── Purchase ──────────────────────────────────────────────────────────────────
  const handlePurchase = async (plan: "digital" | "print") => {
    gtagEvent("begin_checkout", { plan, value: plan === "print" ? 37.99 : 17.99, currency: "USD" });
    if (!PAYMENTS_ENABLED) { generateFullBook(); return; }
    setCheckoutLoading(plan);
    try {
      const ref = crypto.randomUUID();
      sessionStorage.setItem(ref, JSON.stringify({
        childName, childAge, childGender, theme, hairColor, eyeColor,
        story: previewStory,
        photosBase64: photosBase64,
        loraUrl: loraUrl,
        coverFalUrl: previewCoverUrl ? rawFalUrl(previewCoverUrl) : null,
        previewFalUrls: previewImages.map(u => u ? rawFalUrl(u) : null),
        plan,
      }));
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, plan }),
      }).then(r => r.json());
      if (res.url) window.location.href = res.url;
      else throw new Error(res.error || "Checkout failed");
    } catch (err: any) { alert("Payment setup failed: " + err.message); setCheckoutLoading(null); }
  };

  // ── Navigation ────────────────────────────────────────────────────────────────
  const goToStep = (newStep: number) => {
    setStepDir(newStep > onboardingStep ? "fwd" : "back");
    setOnboardingStep(newStep);
  };

  const navigate = (newPage: number) => {
    setNavDir(newPage > currentPage ? "fwd" : "back");
    setCurrentPage(newPage);
  };

  // ── Regen / Share / PDF ───────────────────────────────────────────────────────
  const regenerateScene = async (pageIdx: number) => {
    if (!loraUrl || regeneratingPage !== null) return;
    setRegeneratingPage(pageIdx);
    try {
      const illustrationDesc = story?.pages?.[pageIdx]?.illustration;
      const storyText = story?.pages?.[pageIdx]?.text || "";
      const basePrompt = illustrationDesc
        ? `a photo of TOK, ${illustrationDesc} Scene context: ${storyText.substring(0, 120)} ${STYLE_TOKEN} ${SAFETY}`
        : (SCENE_PROMPTS_BY_THEME[theme] ?? SCENE_PROMPTS_BY_THEME.adventure)[pageIdx];
      const prompt = buildGenderedPrompt(basePrompt, childGender, childAge, hairColor, eyeColor);
      const seed = Math.floor(Math.random() * 2_147_483_647);
      const res = await fetch("/api/generate-scene", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loraUrl, prompt, seed }),
      }).then(r => r.json());
      if (res.url) setPageImages(prev => { const n = [...prev]; n[pageIdx] = `/api/proxy?url=${encodeURIComponent(res.url)}`; return n; });
    } catch (err) { console.error("Regenerate failed:", err); }
    setRegeneratingPage(null);
  };

  const submitLeadEmail = async () => {
    if (!leadEmail || leadSent) return;
    setLeadSending(true);
    try {
      const shareUrl = `${window.location.origin}/create?share=${encodeShare({ story: previewStory, coverFalUrl: previewCoverUrl ? rawFalUrl(previewCoverUrl) : null, pageFalUrls: previewImages.map(u => u ? rawFalUrl(u) : null) })}`;
      await fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "preview_lead", email: leadEmail, shareUrl }) });
      setLeadSent(true);
      gtagEvent("lead_captured", { method: "preview_email" });
    } catch {}
    setLeadSending(false);
  };

  const copyShareLink = async () => {
    if (!story) return;
    // Strip illustration fields — not needed for viewing, reduces URL size
    const shareStory = {
      ...story,
      pages: (story.pages || []).map(({ pageNum, text }: any) => ({ pageNum, text })),
    };
    const data = { story: shareStory, coverFalUrl: coverImageUrl ? rawFalUrl(coverImageUrl) : null, pageFalUrls: pageImages.map(u => u ? rawFalUrl(u) : null) };
    const url = `${window.location.origin}/create?share=${encodeShare(data)}`;
    try { await navigator.clipboard.writeText(url); setShareCopied(true); setTimeout(() => setShareCopied(false), 2500); } catch {}
  };

  const printBook = () => {
    window.print();
  };

  // ── Lulu print fulfillment — triggered after print payment ────────────────────
  useEffect(() => {
    if (!pendingPrintSession || mainStep !== "book" || !story || printFulfilledRef.current) return;
    if (pageImages.filter(Boolean).length < 6) return; // wait for all scenes
    printFulfilledRef.current = true;
    setPrintFulfilling(true);

    const coverFalUrl  = coverImageUrl ? rawFalUrl(coverImageUrl) : null;
    const pageFalUrls  = pageImages.map(u => (u && u !== "__failed__") ? rawFalUrl(u) : null);

    fetch("/api/fulfill-print-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId:   pendingPrintSession,
        coverFalUrl,
        pageFalUrls,
        story,
        childName,
        theme,
      }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          setPrintOrdered(true);
        } else {
          setPrintOrderError(res.error || "Print order failed — please contact us at hello@mytinytales.studio");
        }
      })
      .catch(err => setPrintOrderError(err.message))
      .finally(() => setPrintFulfilling(false));
  }, [pendingPrintSession, mainStep, story, pageImages, coverImageUrl, childName, theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetAll = () => {
    setMainStep("onboarding"); setOnboardingStep(1); setStepDir("fwd");
    setPhotos([]); setPhotosBase64([]); setLoraUrl(null);
    setHairColor("brown"); setEyeColor("brown");
    setStory(null); setPreviewStory(null); setPreviewImages(Array(6).fill(null));
    setPreviewCoverUrl(null); setCoverImageUrl(null);
    setPreviewStatus("idle"); setPreviewDone(0); previewStarted.current = false;
    setPageImages(Array(6).fill(null)); setScenesCompleted(0);
    setChildGender("boy"); setChildName(""); setChildAge(5); setTheme("adventure");
    setIsSharedView(false); setRegeneratingPage(null); setFalError(null); setIsDemo(false); setShowNewBookConfirm(false);
  };

  const totalPages = story?.pages?.length ?? 6;

  // ── BookSpread — split-page layout: text left, illustration right with bleed ──
  const BookSpread = ({ spreadIndex }: { spreadIndex: number }) => {
    const page     = story.pages[spreadIndex];
    if (!page) return null;
    const sceneImg    = pageImages[page.pageNum - 1];
    const isRegen     = regeneratingPage === page.pageNum - 1;
    const chapterNum  = CHAPTER_NAMES[page.pageNum - 1] || String(page.pageNum);

    // ── Shared illustration slot ──────────────────────────────────────────────
    const IllustrationSlot = () => (
      <>
        {isRegen ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(255,215,0,0.2)", borderTop: "3px solid #ffd700", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>Repainting...</span>
          </div>
        ) : sceneImg === "__failed__" ? (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #2D1B69 0%, #1a0a2e 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40, opacity: 0.7 }}>✨</span>
          </div>
        ) : sceneImg ? (
          <img crossOrigin="anonymous" src={sceneImg} alt={`Page ${page.pageNum}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 60%, #0d071e 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 28, height: 28, border: "3px solid rgba(255,215,0,0.15)", borderTop: "3px solid rgba(255,215,0,0.5)", borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
          </div>
        )}
      </>
    );

    // ── Same split layout for both mobile and desktop, scaled to fit ──────────
    // Mobile: 3/2 aspect ratio, compact padding + smaller type
    // Desktop: fixed 520px height, generous padding + larger type
    return (
      <div className="print-spread scene-wrap" style={{
        position: "relative", width: "100%", overflow: "hidden", background: "#05020f",
        height: isMobile ? undefined : 520,
        aspectRatio: isMobile ? "3 / 2" : undefined,
      }}>
        {/* Illustration — full frame */}
        <IllustrationSlot />

        {/* Left-bleed gradient: image fades into dark text zone */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #05020f 0%, #05020f 26%, rgba(5,2,15,0.9) 38%, rgba(5,2,15,0.5) 50%, transparent 66%)", zIndex: 1 }} />

        {/* Thin top vignette */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: isMobile ? 36 : 60, background: "linear-gradient(to bottom, rgba(5,2,15,0.45) 0%, transparent 100%)", zIndex: 1 }} />

        {/* Text column — solid dark zone, left 43% */}
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: "43%", zIndex: 2,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: isMobile ? "16px 14px 16px 16px" : "48px 44px 48px 44px",
        }}>
          {/* Chapter label */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, marginBottom: isMobile ? 10 : 22 }}>
            <div style={{ height: 1, width: isMobile ? 12 : 20, background: "rgba(255,215,0,0.4)", flexShrink: 0 }} />
            <span style={{ color: "rgba(255,215,0,0.72)", fontSize: isMobile ? 7 : 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: "Georgia, serif", whiteSpace: "nowrap" }}>Ch. {chapterNum}</span>
          </div>

          {/* Story text */}
          <p style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: isMobile ? 10 : 15, lineHeight: isMobile ? 1.65 : 1.8, color: "rgba(255,255,255,0.92)", margin: 0, letterSpacing: "0.01em" }}>
            {page.text}
          </p>

          {/* Page number */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, marginTop: isMobile ? 10 : 24 }}>
            <div style={{ height: 1, width: isMobile ? 16 : 32, background: "rgba(255,215,0,0.25)", flexShrink: 0 }} />
            <span style={{ color: "rgba(255,215,0,0.4)", fontFamily: "Georgia, serif", fontSize: isMobile ? 7 : 9, letterSpacing: "0.14em" }}>— {page.pageNum} —</span>
          </div>
        </div>

        {/* Redo button */}
        {!isSharedView && loraUrl && !isRegen && (
          <button className="regen-btn" onClick={() => regenerateScene(page.pageNum - 1)} style={{ position: "absolute", top: isMobile ? 8 : 12, right: isMobile ? 8 : 12, zIndex: 3, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: isMobile ? "4px 8px" : "5px 10px", color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 10 : 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, backdropFilter: "blur(4px)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            {!isMobile && "Redo"}
          </button>
        )}
      </div>
    );
  };

  // ── Shared dark-page frame (dedication + closing) ─────────────────────────────
  const DarkFrame = ({ children }: { children: React.ReactNode }) => (
    <div style={{ borderRadius: isMobile ? 16 : 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.18)", animation: "fadeUp 0.4s ease both", background: "linear-gradient(160deg, #0d071e 0%, #2D1B69 50%, #0d071e 100%)", minHeight: isMobile ? 420 : 560, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: isMobile ? 32 : 60 }}>
      {/* Double gold border */}
      <div style={{ position: "absolute", inset: isMobile ? 16 : 24, border: "1.5px solid rgba(255,215,0,0.35)", borderRadius: 10, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: isMobile ? 24 : 36, border: "0.5px solid rgba(255,215,0,0.15)", borderRadius: 6, pointerEvents: "none" }} />
      {/* Corner sparkles */}
      {(["6%,6%", "88%,6%", "6%,88%", "88%,88%"] as const).map((pos, i) => (
        <span key={i} style={{ position: "absolute", left: pos.split(",")[0], top: pos.split(",")[1], color: "rgba(255,215,0,0.5)", fontSize: isMobile ? 14 : 18, lineHeight: 1 }}>✦</span>
      ))}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 500 }}>{children}</div>
    </div>
  );

  // ── Mascot ────────────────────────────────────────────────────────────────────
  const Mascot = ({ msg }: { msg: string }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 22 }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #6040c0, #9060e0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "float 3s ease-in-out infinite", boxShadow: "0 4px 16px rgba(96,64,192,0.45)" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="21" x2="21" y2="3"/>
          <line x1="15" y1="9" x2="19" y2="5"/>
          <line x1="5" y1="19" x2="9" y2="15"/>
          <circle cx="19.5" cy="4.5" r="1.5" fill="rgba(255,215,0,0.9)" stroke="none"/>
        </svg>
      </div>
      <div style={{ background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(8px)", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", maxWidth: 380 }}>
        <p style={{ color: "rgba(255,255,255,0.92)", fontSize: 14, margin: 0, lineHeight: 1.7 }}>{msg}</p>
      </div>
    </div>
  );

  // ── Color Picker ──────────────────────────────────────────────────────────────
  const ColorPicker = ({ label, colors, selected, onSelect }: { label: string; colors: typeof HAIR_COLORS; selected: string; onSelect: (id: string) => void }) => (
    <div>
      <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>{label}</label>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {colors.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            title={c.label}
            style={{ position: "relative", width: 52, height: 52, borderRadius: "50%", background: c.hex, border: `3px solid ${selected === c.id ? "#ffd700" : "rgba(255,255,255,0.15)"}`, cursor: "pointer", boxShadow: selected === c.id ? "0 0 0 3px rgba(255,215,0,0.3), 0 4px 12px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.3)", transition: "all 0.15s ease", padding: 0, flexShrink: 0 }}
            aria-label={c.label}
          >
            {selected === c.id && (
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c.hex === "#1A1A1A" || c.hex === "#3B1F0E" || c.hex === "#922B21" || c.hex === "#3E2207" ? "white" : "rgba(0,0,0,0.7)", fontSize: 20, fontWeight: 700 }}>✓</span>
            )}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
        {colors.map(c => (
          <div key={c.id} style={{ width: 52, textAlign: "center", color: selected === c.id ? "#ffd700" : "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: selected === c.id ? 700 : 400, transition: "color 0.15s" }}>{c.label}</div>
        ))}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 45%, #1a3a2e 100%)", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: isMobile ? "20px 12px 50px" : "36px 16px 70px", position: "relative", overflow: "hidden" }}>
      {/* Aurora blobs */}
      <div style={{ position: "fixed", top: "-20%", left: "-15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,50,160,0.45) 0%, transparent 70%)", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-15%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(80,20,120,0.35) 0%, transparent 70%)", filter: "blur(110px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes shimmer   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes slideInFwd  { from{opacity:0;transform:translateX(44px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes slideInBack { from{opacity:0;transform:translateX(-44px)} to{opacity:1;transform:translateX(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulseDot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes fwdBar    { from{width:5%} to{width:95%} }
        input::placeholder{color:rgba(255,255,255,0.25);}
        input:focus{border-color:rgba(255,215,0,0.5)!important;outline:none;}
        input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:rgba(255,255,255,0.15);outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#ffd700;cursor:pointer;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);}
        .scene-wrap .regen-btn{opacity:0;transition:opacity 0.2s;}
        .scene-wrap:hover .regen-btn{opacity:1;}
        .theme-card{transition:transform 0.15s ease,box-shadow 0.15s ease;}
        .theme-card:hover{transform:translateY(-4px);box-shadow:0 8px 28px rgba(0,0,0,0.3)!important;}

        /* ── Print styles ── */
        @page { size: landscape; margin: 0; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #000 !important; }
          /* Hide the entire Next.js shell — only show the portal */
          body > *:not(#print-book-root) { display: none !important; }
          #print-book-root {
            display: block !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          #print-book-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          .print-page {
            width: 100vw !important;
            height: 100vh !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            position: relative !important;
          }
          .print-page:last-child { page-break-after: avoid !important; break-after: avoid !important; }
          /* Story spreads: full-bleed illustration with text overlay */
          .print-spread {
            width: 100% !important;
            height: 100% !important;
            position: relative !important;
            border-radius: 0 !important;
            overflow: hidden !important;
          }
          .print-spread img {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          /* Hide regen button in print */
          .regen-btn { display: none !important; }
        }
        @media not print {
          #print-book-root { display: none !important; }
        }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: isMobile ? 18 : 24, animation: "fadeUp 0.5s ease both", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ animation: "float 3s ease-in-out infinite" }}>
          <svg width={isMobile ? 28 : 34} height={isMobile ? 28 : 34} viewBox="0 0 24 24" fill="#ffd700" stroke="none" aria-hidden="true">
            <path d="M12 1l2.39 7.61L22 12l-7.61 2.39L12 22l-2.39-7.61L2 12l7.61-2.39z"/>
          </svg>
        </div>
        <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, background: "linear-gradient(90deg, #ffd700, #ff9a9e, #a18cd1, #ffd700)", backgroundSize: "300% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s ease infinite" }}>My Tiny Tales</h1>
      </div>

      {/* ══ ONBOARDING ══════════════════════════════════════════════════════════ */}
      {mainStep === "onboarding" && (
        <>
          {/* Step indicator */}
          {(() => {
            const stepLabels = ["Photo", "Looks", "About", "Adventure", "Preview"];
            return (
              <div style={{ marginBottom: 28, animation: "fadeUp 0.4s ease both", width: "100%", maxWidth: 540 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                  {/* connector line */}
                  <div style={{ position: "absolute", top: 14, left: "10%", right: "10%", height: 2, background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
                  <div style={{ position: "absolute", top: 14, left: "10%", height: 2, background: "linear-gradient(to right, #ffd700, rgba(255,154,158,0.6))", zIndex: 1, width: `${Math.min((onboardingStep - 1) / (TOTAL_STEPS - 1), 1) * 80}%`, transition: "width 0.4s ease" }} />
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                    const done = i + 1 < onboardingStep;
                    const active = i + 1 === onboardingStep;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", zIndex: 2 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "#ffd700" : active ? "linear-gradient(135deg, #ffd700, #ff9a9e)" : "rgba(255,255,255,0.1)", border: active ? "none" : done ? "none" : "1.5px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.35s ease", boxShadow: active ? "0 0 16px rgba(255,215,0,0.5)" : "none" }}>
                          {done ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a0a2e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 700, color: active ? "#1a0a2e" : "rgba(255,255,255,0.4)" }}>{i + 1}</span>
                          )}
                        </div>
                        {!isMobile && <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? "#ffd700" : done ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.25)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{stepLabels[i]}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div key={`step-${onboardingStep}`} style={{ width: "100%", maxWidth: onboardingStep === 4 ? 740 : 540, animation: `${stepDir === "fwd" ? "slideInFwd" : "slideInBack"} 0.3s ease both` }}>

            {/* ── STEP 1: Upload ── */}
            {onboardingStep === 1 && (
              <div>
                <Mascot msg="Upload 1-2 clear photos of your child for the best likeness. Front facing, good lighting, no sunglasses." />

                {/* Photo slot */}
                {/* Photo slots */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  style={{ background: dragOver ? "rgba(255,215,0,0.04)" : "rgba(255,255,255,0.03)", border: `2px dashed ${dragOver ? "#ffd700" : photos.length > 0 ? "rgba(76,175,80,0.4)" : "rgba(255,255,255,0.15)"}`, borderRadius: 22, padding: "20px", transition: "all 0.2s" }}
                >
                  {/* Counter */}
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <span style={{ color: photos.length > 0 ? "#4caf50" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600 }}>
                      {photos.length}/2 photos added
                    </span>
                    {photos.length === 0 && <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, margin: "4px 0 0" }}>Tap + or drag & drop</p>}
                  </div>

                  {/* Thumbnails row */}
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    {photos.map((src, i) => (
                      <div key={i} style={{ position: "relative", width: 130, height: 130, borderRadius: 14, overflow: "hidden", border: "2px solid rgba(76,175,80,0.5)", flexShrink: 0 }}>
                        <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "white", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                      </div>
                    ))}

                    {/* Add slot — visible when < 2 photos */}
                    {photos.length < 2 && (
                      <div onClick={() => fileRef.current?.click()} style={{ width: 130, height: 130, borderRadius: 14, border: "2px dashed rgba(255,255,255,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 6, background: "rgba(255,255,255,0.03)", flexShrink: 0 }}>
                        <span style={{ fontSize: 32, opacity: 0.45 }}>+</span>
                        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{photos.length === 0 ? "Add photo" : "Add 2nd photo"}</span>
                      </div>
                    )}
                  </div>

                  {photos.length > 0 && (
                    <div style={{ textAlign: "center", marginTop: 12, color: "#4caf50", fontWeight: 700, fontSize: 14 }}>
                      ✓ {photos.length === 2 ? "2 photos — best likeness!" : "1 photo added — add a 2nd for better results"}
                    </div>
                  )}
                </div>

                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) addPhoto(f); e.target.value = ""; }} />

                {/* Privacy reassurance */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: 12, padding: "10px 14px", marginTop: 12 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>Your photos are <strong style={{ color: "#4caf50" }}>never stored on our servers</strong> — processed securely to personalise your book, then permanently deleted.</p>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  {[
                    { svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, text: "Front-facing" },
                    { svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>, text: "Good lighting" },
                    { svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="1" y1="1" x2="23" y2="23"/><path d="M10.5 10.5A2 2 0 0 0 8 12H4a4 4 0 0 0 4 4h8a4 4 0 0 0 3.46-2"/><path d="M21.17 9.17A4 4 0 0 0 20 9h-4a4 4 0 0 0-4 4"/></svg>, text: "No sunglasses" },
                  ].map((tip, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "7px 13px", color: "rgba(255,255,255,0.5)" }}>
                      {tip.svg}
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{tip.text}</span>
                    </div>
                  ))}
                </div>

                {photos.length >= 1 && (
                  <button onClick={() => goToStep(2)} style={{ width: "100%", marginTop: 20, padding: "17px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 17, fontWeight: 700, cursor: "pointer", animation: "fadeUp 0.35s ease both" }}>
                    Continue →
                  </button>
                )}
              </div>
            )}

            {/* ── STEP 2: Appearance ── */}
            {onboardingStep === 2 && (
              <div>
                <Mascot msg="Let's make sure we get every detail right! 🎨 Pick your child's hair and eye colour." />
                <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", borderRadius: 22, padding: isMobile ? 18 : 28, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 28 }}>
                  <ColorPicker label="Hair colour" colors={HAIR_COLORS} selected={hairColor} onSelect={setHairColor} />
                  <ColorPicker label="Eye colour"  colors={EYE_COLORS}  selected={eyeColor}  onSelect={setEyeColor}  />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button onClick={() => goToStep(1)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button
                    onClick={() => goToStep(3)}
                    style={{ flex: 1, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
                  >
                    Looks perfect! →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Customize (name / gender / age) ── */}
            {onboardingStep === 3 && (
              <div>
                <Mascot msg="Amazing! Every hero needs a name. What should we call them? 🌟" />

                {/* Form */}
                <div style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", borderRadius: 22, padding: isMobile ? 18 : 26, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 22 }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Child's first name</label>
                    <input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="e.g. Emma, Liam, Zara..." autoFocus style={{ width: "100%", padding: "14px 16px", borderRadius: 13, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 20, fontWeight: 600, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Boy or Girl?</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {[{ id: "boy", emoji: "👦", label: "Boy" }, { id: "girl", emoji: "👧", label: "Girl" }].map(g => (
                        <div key={g.id} onClick={() => setChildGender(g.id as "boy" | "girl" | "neutral")} style={{ flex: 1, padding: "18px 12px", borderRadius: 16, cursor: "pointer", textAlign: "center", border: `2px solid ${childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.1)"}`, background: childGender === g.id ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)", transition: "all 0.15s", boxShadow: childGender === g.id ? "0 0 16px rgba(255,215,0,0.15)" : "none" }}>
                          <div style={{ fontSize: 36, marginBottom: 6 }}>{g.emoji}</div>
                          <div style={{ color: childGender === g.id ? "#ffd700" : "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 15 }}>{g.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 9 }}>
                      Age — <span style={{ color: "#ffd700", fontSize: 17, fontWeight: 700 }}>{childAge} years old</span>
                    </label>
                    <input type="range" min={1} max={12} step={1} value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} style={{ width: "100%" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>1 yr</span>
                      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>12 yrs</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button onClick={() => goToStep(2)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => goToStep(4)} disabled={!childName.trim()} style={{ flex: 1, padding: "15px", borderRadius: 14, border: "none", background: childName.trim() ? "linear-gradient(135deg, #ffd700, #ff9a9e)" : "rgba(255,255,255,0.08)", color: childName.trim() ? "#1a0a2e" : "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 700, cursor: childName.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                    {childName.trim() ? `Pick ${childName}'s adventure →` : "Enter a name to continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Themes ── */}
            {onboardingStep === 4 && (
              <div>
                <Mascot msg={`Great! Now pick the perfect adventure for ${childName || "your little hero"}...`} />

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
                  {THEMES.map((t) => (
                    <div key={t.id} className="theme-card" onClick={() => setTheme(t.id)} style={{ position: "relative", padding: "22px 18px 18px", borderRadius: 20, cursor: "pointer", border: `2px solid ${theme === t.id ? "#ffd700" : "rgba(255,255,255,0.1)"}`, background: theme === t.id ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.04)", boxShadow: theme === t.id ? "0 0 24px rgba(255,215,0,0.18)" : "0 2px 8px rgba(0,0,0,0.2)" }}>
                      {t.popular && <div style={{ position: "absolute", top: -10, right: 12, background: "linear-gradient(135deg, #ff6b6b, #ee5a24)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em" }}>MOST POPULAR</div>}
                      <div style={{ fontSize: 44, marginBottom: 11 }}>{t.emoji}</div>
                      <div style={{ color: theme === t.id ? "#ffd700" : "white", fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{t.title}</div>
                      <div style={{ color: theme === t.id ? "rgba(255,215,0,0.65)" : "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 9 }}>{t.subtitle}</div>
                      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.6 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                  <button onClick={() => goToStep(3)} style={{ padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button onClick={() => goToStep(5)} style={{ flex: 1, padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
                    Preview your story →
                  </button>
                </div>
                <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                  Takes 3–4 minutes — we&apos;re painting every illustration just for {childName || "your child"}
                </p>
              </div>
            )}

            {/* ── STEP 5: Preview ── */}
            {onboardingStep === 5 && (
              <div>
                {/* Full-screen loading — shown until ALL scenes done */}
                {previewStatus !== "done" && (
                  <div style={{ textAlign: "center", padding: isMobile ? "56px 20px" : "72px 32px", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                    {/* Mobile keep-tab-open notice */}
                    {isMobile && (
                      <div style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 10, padding: "8px 14px", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p style={{ color: "rgba(255,215,0,0.85)", fontSize: 12, margin: 0, textAlign: "left" }}>Keep this tab open while we create your book</p>
                      </div>
                    )}
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: trainingFailed ? "linear-gradient(135deg, #804040, #c06060)" : "linear-gradient(135deg, #6040c0, #c060e0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "float 2s ease-in-out infinite", boxShadow: trainingFailed ? "0 8px 32px rgba(192,64,64,0.5)" : "0 8px 32px rgba(96,64,192,0.5)" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="3" y1="21" x2="21" y2="3"/>
                        <line x1="15" y1="9" x2="19" y2="5"/>
                        <line x1="5" y1="19" x2="9" y2="15"/>
                        <circle cx="19.5" cy="4.5" r="1.5" fill="rgba(255,215,0,0.9)" stroke="none"/>
                      </svg>
                    </div>
                    <h2 style={{ color: "white", fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: "0 0 6px" }}>
                      {trainingFailed ? "Story ready!" : "Creating your story..."}
                    </h2>
                    {!trainingFailed && (
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "0 0 12px" }}>
                        Takes 3–4 minutes — we&apos;re painting every illustration to look just like {childName || "your child"}
                      </p>
                    )}
                    <p style={{ color: trainingFailed ? "rgba(255,180,100,0.9)" : "rgba(255,215,0,0.9)", fontSize: 15, fontWeight: 600, margin: "0 0 8px", minHeight: 24 }}>{previewMsg}</p>
                    {/* Tab-backgrounded warning */}
                    {tabHidden && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,160,0,0.12)", border: "1px solid rgba(255,160,0,0.35)", borderRadius: 10, padding: "9px 14px", margin: "0 0 12px", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        <p style={{ color: "rgba(255,200,100,0.95)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>Keep this tab open — generation pauses when the browser is minimised</p>
                      </div>
                    )}
                    {!trainingFailed && previewDone > 0 && (
                      <div style={{ maxWidth: 240, margin: "12px auto 20px" }}>
                        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #ffd700, #ff9a9e)", width: `${(previewDone / 7) * 100}%`, transition: "width 0.5s ease" }} />
                        </div>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6 }}>{previewDone} of 7 scenes</p>
                      </div>
                    )}
                    {!trainingFailed && (
                      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                        {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd700", animation: "pulseDot 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* Rate limit reached */}
                {previewStatus === "done" && previewStory?._limitReached && (
                  <div style={{ textAlign: "center", padding: isMobile ? "40px 20px" : "56px 32px", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", borderRadius: 24, border: "1px solid rgba(255,100,100,0.2)" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,100,100,0.12)", border: "1px solid rgba(255,100,100,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <h2 style={{ color: "white", fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: "0 0 10px" }}>Free preview limit reached</h2>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 24px" }}>You've used 5 free previews in 24 hours. Purchase once to unlock unlimited generations.</p>
                    <button onClick={() => handlePurchase("digital")} disabled={!!checkoutLoading} style={{ padding: "15px 36px", borderRadius: 16, border: "none", background: checkoutLoading ? "rgba(255,215,0,0.5)" : "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 16, fontWeight: 800, cursor: checkoutLoading ? "not-allowed" : "pointer" }}>
                      {checkoutLoading === "digital" ? "Redirecting..." : "Unlock My Book — $17.99 →"}
                    </button>
                  </div>
                )}

                {/* Revealed preview — fades in once ALL 7 done */}
                {previewStatus === "done" && previewStory && !previewStory._limitReached && (
                  <div style={{ animation: "fadeIn 0.7s ease both" }}>
                    <Mascot msg={`Here's a sneak peek of ${childName || "your child"}'s story — take a look!`} />

                    {/* Cover thumbnail */}
                    {previewCoverUrl && (
                      <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", marginBottom: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
                        <img src={previewCoverUrl} alt="Book cover" style={{ width: "100%", height: isMobile ? 180 : 220, objectFit: "cover", display: "block" }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 40%, rgba(0,0,0,0.15) 100%)" }} />
                        <div style={{ position: "absolute", bottom: 16, left: 18, right: 18 }}>
                          <div style={{ color: "#ffd700", fontWeight: 800, fontSize: isMobile ? 16 : 19, textShadow: "0 2px 8px rgba(0,0,0,0.6)", marginBottom: 3 }}>{previewStory.title}</div>
                          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontStyle: "italic" }}>{previewStory.dedication}</div>
                        </div>
                        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,215,0,0.95)", borderRadius: 8, padding: "3px 9px", fontSize: 10, fontWeight: 700, color: "#1a0a2e" }}>✨ Cover</div>
                      </div>
                    )}

                    {/* Retry failed scenes */}
                    {previewImages.some(img => img === "__failed__") && (
                      <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <p style={{ color: "rgba(255,200,200,0.9)", fontSize: 13, margin: 0 }}>Some scenes didn't load — tap to retry them.</p>
                        <button onClick={retryFailedPreviewScenes} disabled={retryingScenes} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 10, border: "none", background: retryingScenes ? "rgba(255,255,255,0.15)" : "rgba(255,100,100,0.25)", color: "white", fontSize: 12, fontWeight: 700, cursor: retryingScenes ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                          {retryingScenes ? "Retrying..." : "Retry scenes"}
                        </button>
                      </div>
                    )}

                    {/* Pages 1 & 2 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
                      {previewStory.pages.slice(0, 2).map((page: any, idx: number) => {
                        const img = previewImages[idx];
                        return (
                          <div key={idx} style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", display: "flex", flexDirection: isMobile ? "column" : "row" }}>
                            <div style={{ flex: isMobile ? undefined : "0 0 45%", aspectRatio: isMobile ? "4/2.5" : undefined, minHeight: isMobile ? undefined : 180, background: "#1a1a2e", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                              {img && img !== "__failed__" && <img src={img} alt={`Page ${page.pageNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                              <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", borderRadius: 8, padding: "2px 8px", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700 }}>Page {page.pageNum}</div>
                              <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,215,0,0.95)", borderRadius: 8, padding: "2px 8px", color: "#1a0a2e", fontSize: 10, fontWeight: 700 }}>✨ AI Scene</div>
                            </div>
                            <div style={{ flex: 1, padding: "18px 20px", background: "#fff8f0", display: "flex", alignItems: "center" }}>
                              <p style={{ fontFamily: "Georgia, serif", fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: "#3d2b1f", margin: 0 }}>{page.text}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Locked pages 3-6 */}
                      <div style={{ position: "relative" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
                          {previewStory.pages.slice(2).map((page: any, idx: number) => {
                            const img = previewImages[idx + 2];
                            return (
                              <div key={idx} style={{ background: "white", borderRadius: 14, overflow: "hidden", height: 90, display: "flex" }}>
                                <div style={{ flex: "0 0 40%", background: img ? "#1a1a2e" : PAGE_BACKGROUNDS[(idx + 2) % PAGE_BACKGROUNDS.length], position: "relative", overflow: "hidden" }}>
                                  {img && img !== "__failed__" && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                </div>
                                <div style={{ flex: 1, background: "#fff8f0", padding: "14px 16px" }}>
                                  <div style={{ height: 10, background: "#e0d4c8", borderRadius: 5, marginBottom: 8, width: "80%" }} />
                                  <div style={{ height: 10, background: "#e0d4c8", borderRadius: 5, width: "55%" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(26,10,46,0.78)", borderRadius: 14, backdropFilter: "blur(4px)" }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </div>
                          <p style={{ color: "white", fontWeight: 700, fontSize: 15, margin: "0 0 4px", textAlign: "center" }}>Pages 3–6 are waiting!</p>
                          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>Unlock your full story below</p>
                        </div>
                      </div>
                    </div>

                    {/* Email lead capture */}
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 18px", marginBottom: 14, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, alignItems: isMobile ? "stretch" : "center" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "white", fontWeight: 600, fontSize: 13, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 6 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          Email me my preview link
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: 0 }}>Save it to come back and purchase later</p>
                      </div>
                      {leadSent ? (
                        <div style={{ color: "#4caf50", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>✓ Sent!</div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          <input value={leadEmail} onChange={e => setLeadEmail(e.target.value)} type="email" placeholder="your@email.com"
                            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 13, width: 180 }} />
                          <button onClick={submitLeadEmail} disabled={leadSending || !leadEmail} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: leadEmail ? "linear-gradient(135deg, #ffd700, #ff9a9e)" : "rgba(255,255,255,0.1)", color: leadEmail ? "#1a0a2e" : "rgba(255,255,255,0.3)", fontWeight: 700, fontSize: 13, cursor: leadEmail ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
                            {leadSending ? "…" : "Send →"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CTAs */}
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 22, padding: isMobile ? 18 : 24 }}>
                      <p style={{ color: "rgba(255,215,0,0.9)", fontSize: 13, fontWeight: 700, textAlign: "center", margin: "0 0 4px", letterSpacing: "0.04em" }}>Your story is being crafted with care</p>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center", margin: "0 0 18px" }}>6 personalised cinematic 3D-illustrated pages starring {childName || "your child"}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <button onClick={() => handlePurchase("digital")} disabled={!!checkoutLoading} style={{ width: "100%", padding: "17px", borderRadius: 16, border: "none", background: checkoutLoading === "digital" ? "rgba(255,215,0,0.5)" : "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 17, fontWeight: 800, cursor: checkoutLoading ? "not-allowed" : "pointer" }}>
                          {checkoutLoading === "digital" ? "Redirecting..." : PAYMENTS_ENABLED ? "Get Digital Book — $17.99 →" : "✨ Create My Storybook!"}
                        </button>
                        {PAYMENTS_ENABLED && (
                          <button onClick={() => handlePurchase("print")} disabled={!!checkoutLoading} style={{ width: "100%", padding: "15px", borderRadius: 16, border: "2px solid rgba(255,215,0,0.35)", background: "rgba(255,215,0,0.07)", color: "#ffd700", fontSize: 16, fontWeight: 700, cursor: checkoutLoading ? "not-allowed" : "pointer" }}>
                            {checkoutLoading === "print" ? "Redirecting..." : "Print + Digital — $37.99"}
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: isMobile ? 10 : 20, marginTop: 14, flexWrap: "wrap" }}>
                        {[
                          { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: "Secure checkout" },
                          { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, text: "Instant download" },
                          { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: "30-day guarantee" },
                        ].map((t, i) => (
                          <span key={i} style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>{t.icon}{t.text}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => goToStep(4)} style={{ display: "block", margin: "14px auto 0", padding: "8px 16px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}>← Change adventure</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ GENERATING ══════════════════════════════════════════════════════════ */}
      {mainStep === "generating" && (
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both", maxWidth: 400, width: "100%", padding: "0 16px" }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #6040c0, #c060e0)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "float 2s ease-in-out infinite", boxShadow: "0 8px 40px rgba(96,64,192,0.5)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="21" x2="21" y2="3"/>
              <line x1="15" y1="9" x2="19" y2="5"/>
              <line x1="5" y1="19" x2="9" y2="15"/>
              <circle cx="19.5" cy="4.5" r="1.5" fill="rgba(255,215,0,0.9)" stroke="none"/>
            </svg>
          </div>
          <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Creating your magical book...</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 8px" }}>{loadingMsg}</p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 24px" }}>Painting your cover and 6 unique illustrated scenes</p>
          {scenesCompleted > 0 && (
            <div style={{ maxWidth: 260, margin: "0 auto 24px" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #ffd700, #ff9a9e)", width: `${(scenesCompleted / 7) * 100}%`, transition: "width 0.4s ease" }} />
              </div>
              <p style={{ color: "rgba(255,215,0,0.7)", fontSize: 12, marginTop: 7 }}>{scenesCompleted} of 7 illustrations painted</p>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#ffd700", animation: "pulseDot 1s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      )}

      {/* ══ BOOK ════════════════════════════════════════════════════════════════ */}
      {mainStep === "book" && story && (
        <div style={{ width: "100%", maxWidth: isMobile ? "100%" : 880, animation: "fadeUp 0.5s ease both" }}>
          {falError    && <div style={{ background: "rgba(255,100,100,0.09)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: 10, padding: "9px 14px", marginBottom: 12, color: "#ffaaaa", fontSize: 13, textAlign: "center" }}>⚠️ {falError}</div>}
          {isSharedView && <div style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, color: "rgba(255,215,0,0.8)", fontSize: 13, textAlign: "center" }}>📖 Viewing a shared storybook</div>}
          {isDemo && <div style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.35)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, color: "#ffd700", fontSize: 13, textAlign: "center", fontWeight: 600 }}>⚡ Demo Mode — no credits used · <a href="/create" style={{ color: "#ffd700", textDecoration: "underline", cursor: "pointer" }} onClick={e => { e.preventDefault(); resetAll(); }}>Create your own</a></div>}

          {(() => {
            // Capitalise first letter of child's name for display
            const capName = childName
              ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
              : "You";
            return null;
          })()}
          {currentPage === -2 ? (
            // ── BOOK COVER — full-bleed poster ───────────────────────────────
            <div style={{ borderRadius: isMobile ? 16 : 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.12)", animation: "fadeUp 0.4s ease both", position: "relative", minHeight: isMobile ? 420 : 560, background: "#07041A" }}>
              {pageImages[0] && pageImages[0] !== "__failed__" && (
                <img src={pageImages[0]} alt="Book cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              )}
              <div style={{ position: "absolute", top: 16, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,215,0,0.92)", borderRadius: 50, padding: "5px 16px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#1a0a2e" aria-hidden="true"><path d="M12 1l2.39 7.61L22 12l-7.61 2.39L12 22l-2.39-7.61L2 12l7.61-2.39z"/></svg>
                  <span style={{ color: "#1a0a2e", fontWeight: 800, fontSize: 11, letterSpacing: "0.06em" }}>My Tiny Tales</span>
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(5,2,15,0.97) 0%, rgba(5,2,15,0.72) 40%, transparent 100%)", padding: isMobile ? "56px 22px 22px" : "90px 36px 28px", zIndex: 2 }}>
                <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "white", fontSize: isMobile ? "1.65rem" : "2.4rem", fontWeight: 900, margin: "0 0 6px", lineHeight: 1.15, textShadow: "0 2px 20px rgba(0,0,0,0.8)", wordBreak: "break-word" }}>
                  {story.title}
                </h1>
                <p style={{ color: "rgba(255,215,0,0.75)", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: isMobile ? "0.82rem" : "0.95rem", margin: 0, letterSpacing: "0.03em" }}>
                  {THEMES.find(t => t.id === theme)?.subtitle ?? story.dedication}
                </p>
              </div>
            </div>
          ) : currentPage === -1 ? (
            // ── DEDICATION PAGE ─ full-bleed editorial ────────────────────────────
            (() => {
              const capName = childName
                ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase()
                : 'You';
              return (
                <div style={{ borderRadius: isMobile ? 16 : 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.1)', animation: 'fadeUp 0.4s ease both', position: 'relative', minHeight: isMobile ? 420 : 560, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: isMobile ? '52px 32px' : '72px 64px', background: '#07041A' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%, rgba(80,40,160,0.28) 0%, transparent 65%)', pointerEvents: 'none' }} />
                  <p style={{ position: 'relative', color: 'rgba(255,215,0,0.4)', fontSize: isMobile ? 10 : 11, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', margin: '0 0 20px', fontFamily: 'Georgia, serif' }}>A story created for</p>
                  <h1 style={{ position: 'relative', fontFamily: 'var(--font-playfair, Georgia, serif)', color: 'white', fontSize: isMobile ? '3.2rem' : '5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', lineHeight: 0.95 }}>{capName}</h1>
                  <div style={{ position: 'relative', width: 52, height: 2, background: 'rgba(255,215,0,0.45)', borderRadius: 1, margin: isMobile ? '22px auto' : '30px auto' }} />
                  <p style={{ position: 'relative', fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.58)', fontSize: isMobile ? 14 : 17, lineHeight: 1.85, fontStyle: 'italic', maxWidth: 400, margin: '0 auto' }}>&ldquo;May every adventure remind you how loved, brave, and magical you are.&rdquo;</p>
                  <p style={{ position: 'relative', color: 'rgba(255,215,0,0.22)', fontFamily: 'Georgia, serif', fontSize: 11, letterSpacing: '0.24em', margin: isMobile ? '28px 0 0' : '36px 0 0' }}>My Tiny Tales</p>
                </div>
              );
            })()
          ) : currentPage < totalPages ? (
            // ── STORY SPREADS ────────────────────────────────────────────────────
            <div key={`spread-${currentPage}`} style={{ borderRadius: isMobile ? 12 : 16, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.08)", animation: `${navDir === "fwd" ? "slideInFwd" : "slideInBack"} 0.25s ease both` }}>
              <BookSpread spreadIndex={currentPage} />
            </div>
          ) : (
            // ── CLOSING PAGE ─ full-bleed with last scene ────────────────────
            (() => {
              const capName = childName ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase() : '';
              const closingText = THEME_CLOSING[theme]?.(capName) || ('Remember, ' + capName + ': every great adventure begins with one brave step. The world is full of magic — and you have everything it takes to find it.');
              const bgImg = (pageImages[5] && pageImages[5] !== '__failed__') ? pageImages[5] : (pageImages[4] && pageImages[4] !== '__failed__') ? pageImages[4] : null;
              return (
                <div style={{ borderRadius: isMobile ? 12 : 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,215,0,0.08)', animation: 'fadeUp 0.4s ease both', position: 'relative', minHeight: isMobile ? 420 : 560, background: '#07041A' }}>
                  {bgImg && <img src={bgImg} alt='' style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,2,15,0.55) 0%, rgba(5,2,15,0.88) 100%)' }} />
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: isMobile ? 420 : 560, padding: isMobile ? '52px 28px' : '72px 64px', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,215,0,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', margin: '0 0 14px', fontFamily: 'Georgia, serif' }}>❖ &nbsp; ❖ &nbsp; ❖</p>
                    <h2 style={{ fontFamily: 'var(--font-playfair, Georgia, serif)', color: '#ffd700', fontSize: isMobile ? '3.2rem' : '4.8rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, margin: '0 0 8px', textShadow: '0 0 60px rgba(255,215,0,0.45)' }}>The End</h2>
                    <div style={{ width: 48, height: 1, background: 'rgba(255,215,0,0.4)', margin: isMobile ? '18px auto' : '22px auto' }} />
                    <p style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.62)', fontSize: isMobile ? 13 : 16, lineHeight: 1.9, fontStyle: 'italic', maxWidth: 420, margin: '0 auto 24px' }}>{closingText}</p>
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Georgia, serif', fontSize: 11, fontStyle: 'italic', margin: 0 }}>Created with love &middot; {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              );
            })()
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 10 : 16, marginTop: 18 }}>
            <button onClick={() => navigate(Math.max(-2, currentPage - 1))} disabled={currentPage === -2} style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: 14, cursor: currentPage === -2 ? "not-allowed" : "pointer", opacity: currentPage === -2 ? 0.3 : 1 }}>← Prev</button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Cover dot */}
              <div onClick={() => navigate(-2)} title="Cover" style={{ width: currentPage === -2 ? 10 : 6, height: currentPage === -2 ? 10 : 6, borderRadius: "50%", background: currentPage === -2 ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
              {/* Dedication dot */}
              <div onClick={() => navigate(-1)} title="Dedication" style={{ width: currentPage === -1 ? 10 : 6, height: currentPage === -1 ? 10 : 6, borderRadius: "50%", background: currentPage === -1 ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
              {/* Page dots */}
              {story.pages.map((_: any, i: number) => (
                <div key={i} onClick={() => navigate(i)} title={`Page ${i + 1}`} style={{ width: currentPage === i ? 10 : 6, height: currentPage === i ? 10 : 6, borderRadius: "50%", background: currentPage === i ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
              {/* Closing dot */}
              <div onClick={() => navigate(totalPages)} title="The End" style={{ width: currentPage === totalPages ? 10 : 6, height: currentPage === totalPages ? 10 : 6, borderRadius: "50%", background: currentPage === totalPages ? "#ffd700" : "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }} />
            </div>
            <button onClick={() => navigate(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} style={{ padding: isMobile ? "10px 16px" : "11px 22px", borderRadius: 11, border: "none", background: "linear-gradient(135deg, #F5A623, #ffb347)", color: "#1a0a2e", fontSize: 14, fontWeight: 600, cursor: currentPage >= totalPages ? "not-allowed" : "pointer", opacity: currentPage >= totalPages ? 0.4 : 1 }}>Next →</button>
          </div>

          {/* ── Print order status banner ── */}
          {printFulfilling && (
            <div style={{ margin: "12px auto 0", maxWidth: 900, background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,215,0,0.2)", borderTop: "2.5px solid #ffd700", borderRadius: "50%", animation: "spin 0.9s linear infinite", flexShrink: 0 }} />
              <p style={{ color: "rgba(255,215,0,0.85)", fontSize: 14, margin: 0 }}>
                Generating your print files and submitting to our print partner — this takes about 30 seconds…
              </p>
            </div>
          )}
          {printOrdered && (
            <div style={{ margin: "12px auto 0", maxWidth: 900, background: "rgba(40,200,100,0.08)", border: "1px solid rgba(40,200,100,0.3)", borderRadius: 14, padding: "16px 24px" }}>
              <p style={{ color: "rgba(180,255,200,0.95)", fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>
                Your printed book is on its way!
              </p>
              <p style={{ color: "rgba(180,255,200,0.7)", fontSize: 13, margin: 0 }}>
                Your order has been sent to our print partner (Lulu). You'll receive a shipping confirmation by email within 3–5 business days.
              </p>
            </div>
          )}
          {printOrderError && (
            <div style={{ margin: "12px auto 0", maxWidth: 900, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: 14, padding: "14px 20px" }}>
              <p style={{ color: "rgba(255,180,180,0.9)", fontSize: 13, margin: "0 0 6px", fontWeight: 600 }}>Print order issue</p>
              <p style={{ color: "rgba(255,180,180,0.7)", fontSize: 13, margin: "0 0 8px" }}>{printOrderError}</p>
              <a href="mailto:hello@mytinytales.studio" style={{ color: "#ffd700", fontSize: 12 }}>Contact us →</a>
            </div>
          )}

          {isMobile && (
            <div style={{ margin: "0 auto 12px", maxWidth: 420, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                For the best PDF quality, open this page on a <strong style={{ color: "white" }}>desktop or laptop</strong> to save or print your book.
                You can use the <strong style={{ color: "white" }}>Share Book</strong> link below to pick it up there.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={isMobile ? undefined : printBook} style={{ padding: "10px 20px", borderRadius: 11, border: "none", background: isMobile ? "rgba(255,255,255,0.15)" : "linear-gradient(135deg, #F5A623, #ffb347)", color: isMobile ? "rgba(255,255,255,0.4)" : "#1a0a2e", fontSize: 13, fontWeight: 700, cursor: isMobile ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: isMobile ? 0.5 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Save PDF
            </button>
            <button onClick={copyShareLink} style={{ padding: "10px 20px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: shareCopied ? "linear-gradient(135deg, #667eea, #764ba2)" : "rgba(255,255,255,0.1)", color: shareCopied ? "white" : "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 6 }}>
              {shareCopied ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Link Copied!</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share Book</>
              )}
            </button>
            <button onClick={() => setShowNewBookConfirm(true)} style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>+ New Book</button>
            {isDemo && (
              <button
                onClick={async () => {
                  setKontextLoading(true);
                  setKontextResults(null);
                  try {
                    const res = await fetch("/api/test-kontext", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        imageUrl: kontextImageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
                      }),
                    });
                    const data = await res.json();
                    if (data.results) setKontextResults(data.results);
                    else setKontextResults("error");
                  } catch { setKontextResults("error"); }
                  finally { setKontextLoading(false); }
                }}
                disabled={kontextLoading}
                style={{ padding: "10px 18px", borderRadius: 11, border: "1px solid rgba(255,215,0,0.4)", background: "rgba(244,196,48,0.12)", color: "#ffd700", fontSize: 13, fontWeight: 600, cursor: kontextLoading ? "not-allowed" : "pointer", opacity: kontextLoading ? 0.6 : 1 }}
              >
                {kontextLoading ? "⏳ Generating 3 scenes…" : "🧪 Test Kontext (3 scenes)"}
              </button>
            )}
          </div>

          {/* Kontext image URL input (demo only) */}
          {isDemo && (
            <div style={{ margin: "12px auto 0", maxWidth: 900, display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="url"
                value={kontextImageUrl}
                onChange={e => setKontextImageUrl(e.target.value)}
                placeholder="Paste a photo URL to test with (optional — defaults to sample portrait)"
                style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(255,215,0,0.25)", background: "rgba(255,255,255,0.06)", color: "white", fontSize: 13, outline: "none" }}
              />
              {kontextImageUrl && (
                <button onClick={() => setKontextImageUrl("")} style={{ padding: "9px 12px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>✕</button>
              )}
            </div>
          )}

          {/* Kontext test results (demo only) */}
          {isDemo && kontextResults && (
            <div style={{ margin: "16px auto 0", maxWidth: 900, background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "24px", border: "1px solid rgba(255,215,0,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <p style={{ color: "#ffd700", fontWeight: 700, fontSize: 14, margin: 0 }}>🧪 fal-ai/flux-pro/kontext — 3-scene consistency test</p>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Pixar-style prompt, same reference photo</span>
              </div>
              {kontextResults === "error" ? (
                <p style={{ color: "#ff6b6b", fontSize: 14, margin: 0 }}>Generation failed. Check FAL_API_KEY and that fal-ai/flux-pro/kontext is available on your plan.</p>
              ) : (
                <>
                  {/* Reference photo */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 8px" }}>Reference photo</p>
                    <img
                      src={kontextImageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800"}
                      alt="Reference"
                      style={{ height: 120, borderRadius: 8, display: "block", objectFit: "cover" }}
                    />
                  </div>
                  {/* 3 results side by side */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {(kontextResults as { scene: string; url: string }[]).map((r, i) => (
                      <div key={i}>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 8px", lineHeight: 1.5 }}>
                          <span style={{ color: "#ffd700", fontWeight: 700 }}>Scene {i + 1}:</span> {r.scene.slice(0, 60)}…
                        </p>
                        <img src={r.url} alt={`Scene ${i + 1}`} style={{ width: "100%", borderRadius: 10, display: "block" }} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* New Book confirmation modal */}
          {showNewBookConfirm && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowNewBookConfirm(false)}>
              <div style={{ background: "linear-gradient(160deg, #1a0a2e, #2d1b4e)", borderRadius: 20, padding: "32px 28px", maxWidth: 380, width: "100%", border: "1px solid rgba(255,215,0,0.2)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📖</div>
                <h3 style={{ color: "white", fontWeight: 700, fontSize: 18, margin: "0 0 10px" }}>Start a new book?</h3>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>Your current book will be lost.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowNewBookConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                  <button onClick={resetAll} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #ffd700, #ff9a9e)", color: "#1a0a2e", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Yes, start over</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Print-only book pages — rendered as body portal for correct pagination ── */}
      {mainStep === "book" && story && typeof document !== "undefined" && createPortal(
        <div id="print-book-root">

          {/* Page 1: Cover (front of book) — full-bleed poster */}
          <div className="print-page" style={{ position: "relative", background: "#07041A" }}>
            {coverImageUrl && <img crossOrigin="anonymous" src={coverImageUrl} alt="cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />}
            {/* Top branding */}
            <div style={{ position: "absolute", top: 28, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,215,0,0.92)", borderRadius: 50, padding: "6px 20px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#1a0a2e" aria-hidden="true"><path d="M12 1l2.39 7.61L22 12l-7.61 2.39L12 22l-2.39-7.61L2 12l7.61-2.39z"/></svg>
                <span style={{ color: "#1a0a2e", fontWeight: 800, fontSize: 12, letterSpacing: "0.06em" }}>My Tiny Tales</span>
              </div>
            </div>
            {/* Bottom gradient + title */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(5,2,15,0.97) 0%, rgba(5,2,15,0.72) 40%, transparent 100%)", padding: "100px 80px 48px", zIndex: 2 }}>
              <div style={{ color: "white", fontSize: 52, fontWeight: 900, fontFamily: "Georgia, serif", lineHeight: 1.1, marginBottom: 10, textShadow: "0 2px 24px rgba(0,0,0,0.8)" }}>{story.title}</div>
              <div style={{ color: "rgba(255,215,0,0.75)", fontStyle: "italic", fontSize: 18, fontFamily: "Georgia, serif" }}>{THEMES.find(t => t.id === theme)?.subtitle ?? story.dedication}</div>
            </div>
          </div>

          {/* Page 2: Blank verso (inside front cover — standard in printed books) */}
          <div className="print-page" style={{ background: "#0d071e" }} />

          {/* Page 3: Dedication */}
          <div className="print-page" style={{ position: "relative", background: "#07041A", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(80,40,160,0.3) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", textAlign: "center", maxWidth: 700, padding: "0 80px" }}>
              <p style={{ color: "rgba(255,215,0,0.4)", fontSize: 12, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 24px", fontFamily: "Georgia, serif" }}>A story created for</p>
              <h1 style={{ fontFamily: "Georgia, serif", color: "white", fontSize: 80, fontWeight: 900, margin: 0, letterSpacing: "-0.03em", lineHeight: 0.9 }}>
                {childName ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase() : "You"}
              </h1>
              <div style={{ width: 60, height: 2, background: "rgba(255,215,0,0.45)", borderRadius: 1, margin: "32px auto" }} />
              <p style={{ fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.6)", fontSize: 20, lineHeight: 1.85, fontStyle: "italic", margin: 0 }}>
                &ldquo;May every adventure remind you how loved, brave, and magical you are.&rdquo;
              </p>
              <p style={{ color: "rgba(255,215,0,0.22)", fontFamily: "Georgia, serif", fontSize: 13, letterSpacing: "0.24em", margin: "40px 0 0" }}>My Tiny Tales</p>
            </div>
          </div>

          {/* Pages 4–9: Story spreads — one page per spread */}
          {story.pages.map((_: any, i: number) => (
            <div key={i} className="print-page">
              <BookSpread spreadIndex={i} />
            </div>
          ))}

          {/* Page 10: Closing */}
          {(() => {
            const capName = childName ? childName.charAt(0).toUpperCase() + childName.slice(1).toLowerCase() : "";
            const closingText = THEME_CLOSING[theme]?.(capName) ||
              ("Remember, " + capName + ": every great adventure begins with one brave step. The world is full of magic — and you have everything it takes to find it.");
            const bgImgPrint = (pageImages[5] && pageImages[5] !== "__failed__") ? pageImages[5] : null;
            return (
              <div className="print-page" style={{ position: "relative", background: "#07041A", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                {bgImgPrint && <img crossOrigin="anonymous" src={bgImgPrint} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,2,15,0.5) 0%, rgba(5,2,15,0.9) 100%)" }} />
                <div style={{ position: "relative", textAlign: "center", maxWidth: 720, padding: "0 80px" }}>
                  <p style={{ color: "rgba(255,215,0,0.3)", fontSize: 13, letterSpacing: "0.3em", margin: "0 0 16px", fontFamily: "Georgia, serif" }}>❖ &nbsp; ❖ &nbsp; ❖</p>
                  <h2 style={{ fontFamily: "Georgia, serif", color: "#ffd700", fontSize: 72, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1, margin: "0 0 8px", textShadow: "0 0 60px rgba(255,215,0,0.4)" }}>The End</h2>
                  <div style={{ width: 60, height: 1, background: "rgba(255,215,0,0.4)", margin: "24px auto" }} />
                  <p style={{ fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.65)", fontSize: 20, lineHeight: 1.9, fontStyle: "italic", margin: "0 0 28px" }}>{closingText}</p>
                  <p style={{ color: "rgba(255,255,255,0.22)", fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic", margin: 0 }}>
                    Created with love · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Page 11: Blank inside back cover (print/hardcover only) */}
          <div className="print-page" style={{ background: "#0d071e" }} />

        </div>,
        document.body
      )}
      </div>{/* end inner zIndex wrapper */}
    </div>
  );
}
