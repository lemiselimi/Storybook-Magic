import { Fish, Flame, Footprints, MoonStar, Rocket, TreePalm, TreePine, type LucideProps } from "lucide-react";

// Bubbles has no stock icon; drawn on the same 24px grid and stroke as lucide.
function Bubbles(props: LucideProps) {
  const { size = 24, strokeWidth = 2, ...rest } = props;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <circle cx="9" cy="14" r="6" />
      <circle cx="17.5" cy="7.5" r="3.5" />
      <circle cx="18" cy="17" r="2" />
      <path d="M6.5 11.5a3 3 0 0 1 2.5-1.5" />
    </svg>
  );
}

// One line icon per story world, keyed by STORY_THEMES id. Replaces emoji,
// which render differently on every device.
const ICONS: Record<string, (props: LucideProps) => React.ReactNode> = {
  christmas: TreePine,
  dreamland: MoonStar,
  dragon: Flame,
  dino: Footprints,
  jungle: TreePalm,
  space: Rocket,
  ocean: Fish,
  bubbles: Bubbles,
};

export default function ThemeIcon({ theme, ...props }: { theme: string } & LucideProps) {
  const Icon = ICONS[theme] ?? MoonStar;
  return <Icon aria-hidden="true" strokeWidth={1.6} {...props} />;
}
