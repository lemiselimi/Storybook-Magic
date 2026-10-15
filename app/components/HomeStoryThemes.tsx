import Link from "next/link";
import { STORY_THEMES } from "@/lib/story-themes";
import ThemeIcon from "./ThemeIcon";

const themes = Object.entries(STORY_THEMES);

export default function HomeStoryThemes() {
  return (
    <section className="mtt-themes" id="adventures" aria-labelledby="themes-title">
      <div className="mtt-themes__heading">
        <p className="mtt-kicker">Choose their adventure</p>
        <h2 id="themes-title">{themes.length} story worlds, one little hero.</h2>
        <p>Every story has a gentle companion, a problem only your child can solve, and a keepsake to bring home.</p>
      </div>
      <ul className="mtt-themes__grid">
        {themes.map(([id, theme]) => (
          <li key={id}>
            <Link href={`/create?theme=${id}`} className={`mtt-theme${id === "christmas" ? " mtt-theme--featured" : ""}`}>
              <span className="mtt-theme__icon"><ThemeIcon theme={id} size={26} /></span>
              {id === "christmas" && <span className="mtt-theme__badge">New for Christmas</span>}
              <span className="mtt-theme__category">{theme.category}</span>
              <span className="mtt-theme__title">{theme.title}</span>
              <span className="mtt-theme__line">{theme.selectionLine}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
