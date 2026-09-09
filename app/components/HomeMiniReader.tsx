"use client";

import Image from "next/image";
import { useState } from "react";

// These short passages and their illustrations are the current Off to Dreamland
// sample excerpts already used on the homepage. Keeping them together prevents
// the reader from implying an invented customer story.
const spreads = [
  { image: "/examples/book-1.png", text: "A silver moonbeam begins a bedtime dream.", page: "2" },
  { image: "/examples/book-2.png", text: "Up through the clouds, a new world opens.", page: "4" },
  { image: "/examples/book-3.png", text: "A little dream-cloud needs a brave friend.", page: "6" },
] as const;

export default function HomeMiniReader() {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const spread = spreads[spreadIndex];

  return (
    <section className="mtt-open-book" id="inside-the-book" aria-labelledby="open-book-title">
      <div className="mtt-mini-reader">
        <div className="mtt-open-book__book" aria-label={`Off to Dreamland sample spread ${spreadIndex + 1} of ${spreads.length}`}>
          <div className="mtt-open-book__page mtt-open-book__page--text">
            <span>Off to Dreamland</span>
            <p>{spread.text}</p>
            <small>Story page {spread.page}</small>
          </div>
          <div className="mtt-open-book__page mtt-open-book__page--art">
            <Image key={spread.image} src={spread.image} alt={`Illustration for: ${spread.text}`} fill sizes="(max-width: 720px) 46vw, 31vw" />
          </div>
        </div>
        <div className="mtt-mini-reader__controls">
          <button type="button" onClick={() => setSpreadIndex((index) => Math.max(0, index - 1))} disabled={spreadIndex === 0}>
            <span aria-hidden="true">←</span> Previous
          </button>
          <span aria-live="polite">Spread {spreadIndex + 1} / {spreads.length}</span>
          <button type="button" onClick={() => setSpreadIndex((index) => Math.min(spreads.length - 1, index + 1))} disabled={spreadIndex === spreads.length - 1}>
            Next <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <div className="mtt-open-book__copy">
        <p className="mtt-kicker">Inside a real story</p>
        <h2 id="open-book-title">Words on the left. Their matching illustration on the right.</h2>
        <p>Read three genuine excerpts from the current <em>Off to Dreamland</em> example, in the same facing-page format as every finished Tiny Tale.</p>
        <a href="#story-worlds" className="mtt-text-link">See the illustrated scenes <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}

