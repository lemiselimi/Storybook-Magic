// Story-first adventure briefs shared by the writer and the selection screen.
// Each emotional heart is an undercurrent to the adventure, never a lesson.
// `companion` is the one recurring character's fixed look, repeated in every
// illustration prompt so it stays the same across the book.
export const STORY_THEMES = {
  christmas: {
    title: "Christmas Eve",
    category: "Holiday & Seasonal",
    emotionalHeart: "generosity & noticing others",
    selectionLine: "A snowy Christmas Eve mission to deliver the very last gift.",
    companion: "a small knee-high young reindeer with soft fawn fur, a cream chest, tiny velvet antlers and a red ribbon collar with one silver bell",
    arc: [
      "On Christmas Eve, with the house quiet and snow falling, the child hears a soft jingle and finds a small reindeer resting in the snowy garden.",
      "The reindeer has fallen behind the sleigh team, and the child pulls on boots and a scarf to help it get going again.",
      "The reindeer is still carrying the very last gift of the night, but its name tag blew away in the wind and nobody knows where it belongs.",
      "Together they walk through the sleeping snowy village, every window glowing, while the clock tower creeps toward midnight.",
      "The child's first guess is the biggest, brightest house, but its doorstep is already full of gifts and nobody there is waiting; the reindeer's ears droop.",
      "The child looks closely at the wrapping and notices a small hand-drawn star, then spots the same star drawn in the frost of one small, dim window.",
      "They leave the gift on that quiet doorstep, and the little house's window lights up just as the reindeer's bell rings clear for the journey home.",
      "Back home, the child finds the reindeer's silver bell on their windowsill and hoofprints in the snow leading up into the starry sky, then drifts off to sleep.",
    ],
  },
  dreamland: {
    title: "Off to Dreamland",
    category: "Bedtime & Dreams",
    emotionalHeart: "comfort, wonder & settling down",
    selectionLine: "A moonlit bedtime journey that ends close to home.",
    companion: "a little five-pointed star with a soft golden glow and a gentle sleepy face",
    arc: [
      "As the house grows quiet, a silver moonbeam invites the child to follow it into a soft, starry dreamland.",
      "The child chooses a cloud path and floats past warm windows, sleepy rooftops, and a sky full of small lights.",
      "They meet a little star that cannot settle because its gentle glow keeps waking the dreaming clouds.",
      "Together they search for a place where the star can shine softly without keeping anyone awake.",
      "The first spot is too bright, and the clouds bob restlessly instead of drifting to sleep.",
      "The child notices a quiet pocket of sky beside the moon and suggests a softer way for the star to glow.",
      "The star settles into its place, and dreamland becomes calm enough for every cloud to sigh and rest.",
      "The moonbeam carries the child home to bed, where the same small star twinkles gently through the window.",
    ],
  },
  dragon: {
    title: "Dragon Tamer",
    category: "Fantasy & Magic",
    emotionalHeart: "kindness & trust",
    selectionLine: "A gentle dragon needs a patient new friend.",
    companion: "a knee-high leaf-green baby dragon with amber eyes, a cream belly, two short rounded horns and small gold-lined wings",
    arc: [
      "The child discovers a small dragon hiding from a noisy mountain festival.",
      "They offer the dragon a quiet place and wait for it to decide whether to come closer.",
      "The small green dragon explains that loud noises make it too frightened to produce its gentle flame. They seek a quiet place to practise.",
      "On their walk to a quiet valley, fog hides the path back to the festival. The dragon wants to light their way but is still too frightened.",
      "The child rushes ahead with a plan, but the frightened dragon freezes and the fog closes in.",
      "The child slows down, listens, and realizes the dragon needs a calm invitation, not a command.",
      "With the child waiting calmly beside it, the same small green dragon makes a gentle puff that lights a nearby lantern; they follow the lantern path home. The flame was never a lost object.",
      "At the festival, the dragon chooses to fly beside the child, no longer needing to hide.",
    ],
  },
  dino: {
    title: "Dinosaur Kingdom",
    category: "Dinosaurs & Discovery",
    emotionalHeart: "steady courage & helping",
    selectionLine: "A prehistoric rescue led by a very capable friend.",
    companion: "a baby long-necked dinosaur about the child's height with sea-green skin, a cream belly and darker green spots",
    arc: [
      "The child arrives in a prehistoric valley just as a baby long-necked dinosaur loses sight of its herd.",
      "They promise to help and follow a trail of enormous three-toed footprints pressed into the mud.",
      "Along the way, the child feels a deep rumble in the ground and knows the herd is still near.",
      "A huge fallen tree blocks the valley path while rain begins to fill the footprints.",
      "The child tries to climb over, but the slippery bark sends both of them sliding back to the ground.",
      "The child notices the herd's own footprints curving away through the tall ferns, and leads the baby dinosaur around the tree one careful step at a time.",
      "The pair reach the herd, and the baby dinosaur calls out before anyone else can.",
      "At sunset, the baby dinosaur presses one small three-toed footprint into the mud beside the child's shoe print, and the child heads home.",
    ],
  },
  jungle: {
    title: "Jungle River",
    category: "Animals & Wildlife",
    emotionalHeart: "patience & looking again",
    selectionLine: "A baby elephant needs help getting back across the river to its family.",
    companion: "a baby elephant about the child's height with soft grey skin, big floppy ears with pink inner edges and a short curled trunk",
    arc: [
      "Deep in a sun-dappled jungle, the child hears a small worried trumpet and finds a baby elephant alone at the edge of a wide river.",
      "The baby elephant's family has crossed to the far bank to eat sweet grass, and the little one stayed behind chasing butterflies.",
      "The child promises to help and walks the riverbank beside the baby elephant while its family calls softly from the other side.",
      "They find the narrowest point of the river, where the far bank looks close enough to touch.",
      "But the narrow water is the fastest and deepest; the baby elephant slips back and the current tugs at the child's boots, so they scramble back to the bank.",
      "The child watches the river and notices that where it spreads wide, it runs slow and shallow, with flat stones showing through the ripples.",
      "Side by side, one slow step at a time across the wide shallow stones, they cross, and the baby elephant runs to its mother with a happy trumpet.",
      "As the sun sets, the baby elephant drops a smooth striped river stone into the child's hands, and the child carries it home through the glowing jungle.",
    ],
  },
  space: {
    title: "To The Moon",
    category: "Space & Science",
    emotionalHeart: "curiosity & paying attention",
    selectionLine: "A little lost robot needs a ride home to its hidden moon base.",
    companion: "a knee-high round silver robot with a blue glass face, two stubby arms, small wheels and one antenna tipped with a blinking light",
    arc: [
      "On a clear night, a small silver rocket lands softly in the child's garden, and out rolls a tiny round robot with one blinking antenna light.",
      "The robot belongs to a base on the moon but cannot find its way back alone, so the child climbs into the rocket to fly it home.",
      "They zoom past twinkling satellites and a ringed planet, the robot pressing against the window and searching for home.",
      "They land on the moon, but every grey crater looks the same and the moon base is hidden somewhere among them.",
      "The child heads for the first shining crater, but the glow is only sunlight on moon ice, and the robot's light blinks slow and sad.",
      "The child notices the robot's light blinks faster whenever it faces one direction, and plays a game of warmer and colder, following the quickening blinks.",
      "The blinking turns to a steady glow beside a small crater in the shadows, where a round door slides open and the other robots roll out to welcome it home.",
      "Back in bed, the child looks up at the moon and sees one tiny light blinking goodnight.",
    ],
  },
  ocean: {
    title: "Deep Blue",
    category: "Ocean & Nature",
    emotionalHeart: "care & perseverance",
    selectionLine: "A deep-sea mystery calls for a thoughtful helper.",
    companion: "a small yellow fish with blue fins and a round friendly face",
    arc: [
      "The child dives into a bright reef when a small yellow fish with blue fins asks for help finding a missing current.",
      "They follow a trail of dancing bubbles through sea grass and glowing caves.",
      "The fish shows the child how the gentle current once carried tiny coral seeds to their new homes.",
      "A tangle of old seaweed has blocked the current at a narrow rock arch.",
      "The child's first big tug only knots the seaweed tighter, and the little coral seeds begin to drift away.",
      "They pause, see that the seaweed is looped like a knot, and gently lift one loop at a time instead of pulling.",
      "The current slips free, carrying the seeds through the reef as colour returns around them.",
      "On the surface, the fish gives the child a small spiral shell; held to their ear, it whooshes like the current they set free.",
    ],
  },
  bubbles: {
    title: "Bubble Voyage",
    category: "Floating & Wonder",
    emotionalHeart: "gentle patience & care",
    selectionLine: "A bright sky voyage where a careful helper saves a floating kingdom.",
    companion: "a small round see-through bubble sprite with rosy cheeks and a soft rainbow sheen",
    arc: [
      "The child finds a little bottle of bubble mix and blows one shimmering bubble that keeps growing.",
      "The giant bubble gently lifts the child into a bright sky full of soft clouds.",
      "They drift into a floating kingdom of glowing bubbles, each with a tiny garden inside, looked after by a small bubble sprite.",
      "A cold wind is pushing the bubbles up toward a frosty cloud with sharp icicles, and one by one they pop.",
      "The child tries to push the bubbles back down with their hands, but eager fingers pop one, and the sprite gasps.",
      "The child notices the bubbles drift toward warm breath, and blows soft and slow to steer them away from the icicles.",
      "One by one, the bubbles float down to a sunny, sheltered cloud, and the kingdom settles safely.",
      "The child's own bubble carries them home, and in their pocket they find one tiny bubble that never pops.",
    ],
  },
};

export const AGE_BANDS = {
  "1-3": { label: "Toddler", sentences: "4-7 short read-aloud sentences or rhythmic lines", wordsPerPage: "25-40", totalWords: "200-320" },
  "4-6": { label: "Pre-K", sentences: "2-3 short sentences", wordsPerPage: "20-36", totalWords: "160-260" },
  "7-9": { label: "Early Reader", sentences: "3-4 sentences", wordsPerPage: "28-48", totalWords: "224-360" },
  "10-12": { label: "Confident Reader", sentences: "3-5 sentences", wordsPerPage: "36-58", totalWords: "288-440" },
};

export function getAgeBand(ageNum) {
  if (ageNum <= 3) return "1-3";
  if (ageNum <= 6) return "4-6";
  if (ageNum <= 9) return "7-9";
  return "10-12";
}
