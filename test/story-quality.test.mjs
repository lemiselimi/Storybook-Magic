import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function loadModule(file, names) {
  const source = fs.readFileSync(path.resolve(file), "utf8")
    .replaceAll("export const ", "const ")
    .replaceAll("export function ", "function ");
  return Function(`${source}\nreturn { ${names.join(", ")} };`)();
}

const { STORY_THEMES, AGE_BANDS, getAgeBand } = loadModule("lib/story-themes.js", ["STORY_THEMES", "AGE_BANDS", "getAgeBand"]);
const { MAX_WORDS_PER_PAGE, validateStory, wordCount } = loadModule("lib/story-quality.js", ["MAX_WORDS_PER_PAGE", "validateStory", "wordCount"]);

const examples = [
  {
    age: 2, name: "Mia", theme: "dreamland", title: "Mia and the Sleepy Star",
    pages: [
      "Mia sees a moonbeam. It wiggles by her bed.", "Mia follows the soft moonbeam. Up, up goes Mia.",
      "A tiny star cannot sleep. Its glow tickles the clouds.", "Mia looks for a quiet sky. The clouds bob and yawn.",
      "Mia tries a bright place. Oh no, the clouds wake up.", "Mia finds a moon pocket. The star can glow softly there.",
      "The star makes a small, warm light. Every cloud rests.", "Mia is home in bed. One gentle star shines outside.",
    ],
  },
  {
    age: 5, name: "Theo", theme: "dragon", title: "Theo and the Quiet Dragon",
    pages: [
      "Theo heard a tiny sneeze behind the mountain festival tents. A shy dragon was hiding there, with smoke curling from its nose.", "Theo offered the dragon a quiet path away from the drums. The dragon followed, one careful step at a time.",
      "In the misty valley, the dragon showed Theo its missing first flame. Without it, the village lanterns could not find their way home.", "The fog grew thick around the lantern poles. Theo ran ahead with an idea, but the frightened dragon stopped still.",
      "Theo's first plan was too fast. The dragon tucked its wings close, and the fog swirled even wider.", "Theo listened to the dragon's small rumble. Then Theo asked, Would you like to try one tiny puff together?",
      "The dragon made one brave golden puff. Theo held up a lantern, and the warm light made a path through the mist.", "At the festival, the dragon chose to fly beside Theo. The drums sounded friendly now, not loud at all.",
    ],
  },
  {
    age: 8, name: "Avery", theme: "space", title: "Avery and the Questioning Star",
    pages: [
      "Avery noticed a blue signal blinking between two familiar stars. It flashed the same question again and again: Which way is home?", "Avery packed a small rocket with a notebook and followed the signal past a ringed moon, writing down every clue it offered.",
      "The trail ended on a quiet planet whose constellations had gone dark. Travellers there could not read the sky-map above their heads.", "Avery found the star-lights tangled in the wrong pattern. Every time Avery arranged them, the blue signal looped back to the beginning.",
      "For a moment, Avery wanted to try the same answer louder. Instead, Avery looked at the comet clues again and saw that they made a spiral.", "Avery asked the planet's map keeper one more question. Together they turned the stars in the order of the spiral, slowly and carefully.",
      "The constellation clicked into place, making a bright route across the sky. The travellers cheered as their home lights answered from far away.", "Back on Earth, Avery spotted the blue signal beside the moon. It no longer asked for help; it winked a thank-you.",
    ],
  },
  {
    age: 11, name: "Jordan", theme: "ocean", title: "Jordan and the Lost Current",
    pages: [
      "Jordan had barely reached the coral reef when a cardinalfish arrived with an urgent request: the nursery current had vanished, and the coral seeds were drifting nowhere.", "Rather than guess, Jordan followed a ribbon of bubbles through sea grass and into a blue cave, noticing which way the smallest fish were still swimming.",
      "Beyond the cave, Jordan found a narrow rock arch packed with old seaweed. The gentle current that carried new coral homes had been caught behind it.", "Jordan pulled at the nearest strand, expecting the knot to loosen. It only cinched tighter, and several coral seeds spun away in the dim water.",
      "It was tempting to tug harder, but Jordan watched a crab clear its path sideways, one patient pinch at a time. That gave Jordan a better idea.", "Jordan worked around the arch instead of against it, freeing small loops while the fish carried the loose seaweed away. The water began to hum again.",
      "When the last loop slipped free, the current swept through the reef with the coral seeds dancing inside it. Colour returned to places that had looked pale and waiting.", "At the surface, Jordan held a shell to one ear and heard a faint rushing sound. It was the current's thank-you, still moving where it belonged.",
    ],
  },
];

function buildStory(example) {
  return {
    title: example.title,
    dedication: `For ${example.name}, with wonder.`,
    pages: example.pages.map((text, index) => ({ pageNum: index + 1, text, illustration: `The child actively takes part in scene ${index + 1} with clear environmental context.` })),
  };
}

test("all adventures have one distinct emotional heart and a complete arc", () => {
  assert.equal(Object.keys(STORY_THEMES).length, 9);
  for (const theme of Object.values(STORY_THEMES)) {
    assert.ok(theme.emotionalHeart);
    assert.equal(theme.arc.length, 8);
    assert.ok(theme.selectionLine);
  }
});

test("age bands map ages 2, 5, 8, and 11 to materially different limits", () => {
  assert.deepEqual([2, 5, 8, 11].map(getAgeBand), ["1-3", "4-6", "7-9", "10-12"]);
  assert.equal(Object.keys(AGE_BANDS).length, 4);
  assert.deepEqual(Object.values(MAX_WORDS_PER_PAGE), [18, 40, 54, 64]);
});

for (const example of examples) {
  test(`representative age-${example.age} ${example.theme} story passes production text limits`, () => {
    const ageBand = getAgeBand(example.age);
    const story = buildStory(example);
    assert.equal(validateStory(story, { childName: example.name, ageBand }), null);
    assert.ok(story.pages.every((page) => wordCount(page.text) <= MAX_WORDS_PER_PAGE[ageBand]));
    assert.ok(story.pages.some((page) => page.text.includes(example.name)));
  });
}

test("unresolved values and overlong page copy are rejected before preview", () => {
  const story = buildStory(examples[1]);
  story.pages[2].text = "{{childName}} follows an unresolved prompt.";
  assert.match(validateStory(story, { childName: "Theo", ageBand: "4-6" }), /unresolved value/);

  story.pages[2].text = Array.from({ length: 41 }, () => "word").join(" ");
  assert.match(validateStory(story, { childName: "Theo", ageBand: "4-6" }), /too long/);

  story.pages[2].text = examples[1].pages[2];
  story.title = "A Quiet Dragon";
  assert.match(validateStory(story, { childName: "Theo", ageBand: "4-6" }), /title does not include/);
});
