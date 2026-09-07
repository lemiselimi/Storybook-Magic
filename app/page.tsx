import Image from "next/image";
import Link from "next/link";
import BookMockup3D from "./components/BookMockup3D";
import MarketingFooter from "./components/MarketingFooter";
import MarketingNav from "./components/MarketingNav";
import { PRODUCT } from "@/lib/product";

const P = PRODUCT;

const storyWorlds = [
  { image: "/examples/example-1.webp", title: "The Big Adventure", description: "A brave beginning in a world made just for them." },
  { image: "/examples/example-2.webp", title: "To The Stars", description: "A little explorer with a very big sky to discover." },
  { image: "/examples/example-3.webp", title: "Dragon Tamer", description: "A gentle hero, a nervous dragon, and a friendship to remember." },
];

export default function LandingPage() {
  return (
    <div className="mtt-home">
      <MarketingNav />

      <main>
        <section className="mtt-hero" aria-labelledby="hero-title">
          <div className="mtt-hero__copy">
            <p className="mtt-kicker">Personalised stories for little readers</p>
            <h1 id="hero-title">A storybook where <em>they</em> are the hero.</h1>
            <p className="mtt-hero__lede">Their face. Their name. Their greatest adventure—made into a beautifully illustrated book to read together and keep close.</p>
            <div className="mtt-actions">
              <Link href="/create" className="mtt-button mtt-button--ink">Begin their story <span aria-hidden="true">→</span></Link>
              <a href="#inside-the-book" className="mtt-text-link">Open the book <span aria-hidden="true">↓</span></a>
            </div>
            <p className="mtt-hero__note">See the first {P.freePreviewPages} pages before you decide. No card required.</p>
          </div>

          <div className="mtt-hero__books" aria-label="A personalised My Tiny Tales storybook">
            <div className="mtt-hero__sun" aria-hidden="true" />
            <div className="mtt-hero__book-object">
              <BookMockup3D coverImg="/examples/example-1.webp" width={358} height={470} animate />
            </div>
            <div className="mtt-hero__leaf mtt-hero__leaf--one" aria-hidden="true" />
            <div className="mtt-hero__leaf mtt-hero__leaf--two" aria-hidden="true" />
            <p className="mtt-hero__caption">A tale with their name on the cover.</p>
          </div>
        </section>

        <section className="mtt-introduction" aria-labelledby="introduction-title">
          <p className="mtt-kicker">Made for the ones you love most</p>
          <h2 id="introduction-title">Turn a favourite photo into the story they ask for <em>again and again.</em></h2>
          <div className="mtt-introduction__rule" aria-hidden="true" />
          <p>Choose an adventure, tell us a little about your child, and we will shape a one-of-a-kind illustrated tale around them. The magic is not the technology. It is seeing themselves at the centre of the story.</p>
        </section>

        <section className="mtt-process" id="how-it-works" aria-labelledby="process-title">
          <div className="mtt-process__heading">
            <p className="mtt-kicker">A simple beginning</p>
            <h2 id="process-title">From a moment you treasure to a book they can hold.</h2>
          </div>
          <ol className="mtt-process__steps">
            <li><span>01</span><div><h3>Share a photo</h3><p>Begin with a clear picture of your little reader—the face you know best.</p></div></li>
            <li><span>02</span><div><h3>Choose their adventure</h3><p>Add their name, age, and a world they would love to step into.</p></div></li>
            <li><span>03</span><div><h3>Read the first pages</h3><p>Meet their story before choosing a digital book or a printed keepsake.</p></div></li>
          </ol>
          <Link href="/create" className="mtt-text-link mtt-text-link--strong">Start with their photo <span aria-hidden="true">→</span></Link>
        </section>

        <section className="mtt-open-book" id="inside-the-book" aria-labelledby="open-book-title">
          <div className="mtt-open-book__book">
            <div className="mtt-open-book__page mtt-open-book__page--text">
              <span>Chapter one</span>
              <p>Once upon a time, an ordinary day opened into a world with room for one very special hero.</p>
              <small>My Tiny Tales</small>
            </div>
            <div className="mtt-open-book__page mtt-open-book__page--image">
              <Image src="/examples/example-2.webp" alt="An illustrated space adventure inside a personalised storybook" fill sizes="(max-width: 720px) 90vw, 38vw" />
            </div>
          </div>
          <div className="mtt-open-book__copy">
            <p className="mtt-kicker">Inside their story</p>
            <h2 id="open-book-title">A whole world, with their familiar face in it.</h2>
            <p>Every tale is written around a child at its heart: a curious explorer, a kind friend, a fearless dreamer. Each page gives you something new to linger over at bedtime.</p>
            <a href="#story-worlds" className="mtt-text-link">See the story worlds <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="mtt-worlds" id="story-worlds" aria-labelledby="worlds-title">
          <div className="mtt-worlds__heading">
            <p className="mtt-kicker">A shelf of possibilities</p>
            <h2 id="worlds-title">Their next favourite story starts here.</h2>
          </div>
          <div className="mtt-worlds__grid">
            {storyWorlds.map((world, index) => (
              <article className={`mtt-world mtt-world--${index + 1}`} key={world.title}>
                <div className="mtt-world__image"><Image src={world.image} alt={`${world.title} personalised storybook cover`} fill sizes="(max-width: 720px) 78vw, 30vw" /></div>
                <p className="mtt-world__number">0{index + 1}</p>
                <h3>{world.title}</h3>
                <p>{world.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mtt-keepsake" id="keepsake" aria-labelledby="keepsake-title">
          <div className="mtt-keepsake__image">
            <Image src="/examples/example-3.webp" alt="A richly illustrated personalised children’s book scene" fill sizes="(max-width: 720px) 100vw, 50vw" />
            <span className="mtt-keepsake__ribbon">A book of their own</span>
          </div>
          <div className="mtt-keepsake__copy">
            <p className="mtt-kicker">Made to keep</p>
            <h2 id="keepsake-title">For tonight’s reading—and the bookshelf that holds the years.</h2>
            <p>Keep their tale as a digital storybook, ready to revisit, or choose a printed copy made for bedtime piles, little hands, and family shelves.</p>
            <dl className="mtt-keepsake__options">
              <div><dt>Digital storybook</dt><dd>{P.pricing.digital.label}</dd></div>
              <div><dt>Printed keepsake</dt><dd>{P.pricing.print.label}</dd></div>
            </dl>
            <Link href="/create" className="mtt-button mtt-button--paper">Make their book <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="mtt-quiet-cta" aria-labelledby="cta-title">
          <p className="mtt-kicker">A place for them in the story</p>
          <h2 id="cta-title">The next page has their name on it.</h2>
          <Link href="/create" className="mtt-button mtt-button--ink">Create their storybook <span aria-hidden="true">→</span></Link>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

