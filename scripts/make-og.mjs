// Generates public/og-image.jpg (1200×630) for social sharing.
// Run: node scripts/make-og.mjs
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const W = 1200, H = 630;

const GOLD = "#E8C07A";
const TEXT = "#F5F0E0";

// ── Background + text layer ──────────────────────────────────────────────────
const base = Buffer.from(`
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#07090F"/>
      <stop offset="100%" stop-color="#0E1118"/>
    </linearGradient>
    <radialGradient id="glow" cx="30%" cy="30%" r="60%">
      <stop offset="0%" stop-color="rgba(232,192,122,0.16)"/>
      <stop offset="100%" stop-color="rgba(232,192,122,0)"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Wordmark -->
  <g transform="translate(72,86)">
    <path d="M12 0l3.2 10.1L26 12l-10.8 1.9L12 24l-3.2-10.1L-2 12l10.8-1.9z" fill="${GOLD}"/>
    <text x="40" y="17" font-family="Arial, sans-serif" font-size="19" font-weight="700"
          letter-spacing="4" fill="${TEXT}">MY TINY TALES</text>
  </g>

  <!-- Headline -->
  <text x="72" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700" fill="${TEXT}">Your Child,</text>
  <text x="72" y="326" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700" fill="${TEXT}">The <tspan fill="${GOLD}">Hero</tspan> of</text>
  <text x="72" y="402" font-family="Georgia, 'Times New Roman', serif" font-size="66" font-weight="700" fill="${TEXT}">Their Story</text>

  <!-- Tagline -->
  <text x="74" y="470" font-family="Arial, sans-serif" font-size="24" fill="rgba(245,240,224,0.66)">Personalised AI storybooks · their real face on every page</text>

  <!-- Frame for the cover on the right -->
  <rect x="812" y="120" width="316" height="390" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(232,192,122,0.28)" stroke-width="1.5"/>
</svg>`);

// ── Rounded cover from an example illustration ───────────────────────────────
const CW = 292, CH = 366;
const coverMask = Buffer.from(
  `<svg width="${CW}" height="${CH}"><rect width="${CW}" height="${CH}" rx="12" fill="#fff"/></svg>`
);

const cover = await sharp(join(root, "public/examples/example-1.webp"))
  .resize(CW, CH, { fit: "cover", position: "top" })
  .composite([{ input: coverMask, blend: "dest-in" }])
  .png()
  .toBuffer();

await sharp(base)
  .composite([{ input: cover, left: 824, top: 132 }])
  .jpeg({ quality: 88 })
  .toFile(join(root, "public/og-image.jpg"));

console.log("Wrote public/og-image.jpg");
