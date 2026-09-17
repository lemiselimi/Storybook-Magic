"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

// These passages and illustrations are genuine excerpts from the existing
// Off to Dreamland example. They remain together so this reader does not
// imply an invented customer story or a different production page format.
const spreads = [
  { image: "/examples/book-1.png", text: "A silver moonbeam begins a bedtime dream.", page: "2" },
  { image: "/examples/book-2.png", text: "Up through the clouds, a new world opens.", page: "4" },
  { image: "/examples/book-3.png", text: "A little dream-cloud needs a brave friend.", page: "6" },
] as const;

const totalViews = spreads.length + 1;

export default function HomeMiniReader() {
  const [viewIndex, setViewIndex] = useState(0);
  const [turnDirection, setTurnDirection] = useState<"forward" | "back">("forward");
  const touchStartX = useRef<number | null>(null);
  const isOpening = viewIndex === 0;
  const spread = isOpening ? null : spreads[viewIndex - 1];

  const goTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= totalViews || nextIndex === viewIndex) return;
    setTurnDirection(nextIndex > viewIndex ? "forward" : "back");
    setViewIndex(nextIndex);
  };

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(distance) > 42) goTo(viewIndex + (distance < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <section className="mtt-open-book" id="inside-the-book" aria-labelledby="open-book-title">
      <div className="mtt-mini-reader">
        <div
          className={`mtt-mini-reader__book-frame mtt-mini-reader__book-frame--${turnDirection}`}
          onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX; }}
          onTouchEnd={onTouchEnd}
        >
          <div
            key={viewIndex}
            className="mtt-open-book__book mtt-mini-reader__book"
            role="button"
            tabIndex={0}
            aria-live="polite"
            aria-label={viewIndex < totalViews - 1 ? "Turn to the next page" : "Return to the title leaf"}
            onClick={() => goTo(viewIndex < totalViews - 1 ? viewIndex + 1 : 0)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); goTo(viewIndex < totalViews - 1 ? viewIndex + 1 : 0); } }}
          >
            {isOpening ? (
              <>
                <div className="mtt-open-book__page mtt-open-book__page--text mtt-mini-reader__title-leaf">
                  <span>A real Tiny Tale</span>
                  <h3>Off to<br />Dreamland</h3>
                  <p>An example storybook, opened one page at a time.</p>
                  <small>Tap the page to begin</small>
                </div>
                <div className="mtt-open-book__page mtt-open-book__page--art">
                  <Image src="/examples/book-1.png" alt="A real illustration from the Off to Dreamland example book" fill priority sizes="(max-width: 720px) 46vw, 31vw" />
                </div>
              </>
            ) : (
              <>
                <div className="mtt-open-book__page mtt-open-book__page--text">
                  <span>Off to Dreamland</span>
                  <p>{spread?.text}</p>
                  <small>Story page {spread?.page}</small>
                </div>
                <div className="mtt-open-book__page mtt-open-book__page--art">
                  <Image key={spread?.image} src={spread?.image ?? spreads[0].image} alt={`Illustration for: ${spread?.text ?? "Off to Dreamland"}`} fill sizes="(max-width: 720px) 46vw, 31vw" />
                </div>
              </>
            )}
          </div>
          <button className="mtt-mini-reader__page-edge" type="button" onClick={(event) => { event.stopPropagation(); goTo(viewIndex < totalViews - 1 ? viewIndex + 1 : 0); }} aria-label={viewIndex < totalViews - 1 ? "Turn to the next page" : "Return to the title leaf"}>
            <span aria-hidden="true">{viewIndex < totalViews - 1 ? "→" : "↺"}</span>
          </button>
        </div>

        <div className="mtt-mini-reader__controls">
          <button type="button" onClick={() => goTo(viewIndex - 1)} disabled={viewIndex === 0}>
            <span aria-hidden="true">←</span> Previous
          </button>
          <span>Page {viewIndex + 1} / {totalViews}</span>
          <button type="button" onClick={() => goTo(viewIndex + 1)} disabled={viewIndex === totalViews - 1}>
            Next <span aria-hidden="true">→</span>
          </button>
        </div>
        {viewIndex === totalViews - 1 && (
          <div className="mtt-mini-reader__afterword">
            <p>Now make one starring them.</p>
            <Link href="/create" className="mtt-text-link">See their free preview <span aria-hidden="true">→</span></Link>
          </div>
        )}
      </div>
      <div className="mtt-open-book__copy">
        <p className="mtt-kicker">Inside a real story</p>
        <h2 id="open-book-title">Open a Tiny Tale, one gentle page turn at a time.</h2>
        <p>Read three genuine excerpts from the current <em>Off to Dreamland</em> example, in the same facing-page format as every finished Tiny Tale.</p>
        <a href="#story-worlds" className="mtt-text-link">See the illustrated scenes <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
