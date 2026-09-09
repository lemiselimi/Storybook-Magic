import Image from "next/image";
import Link from "next/link";
import BookMockup3D from "./components/BookMockup3D";
import MarketingFooter from "./components/MarketingFooter";
import MarketingNav from "./components/MarketingNav";
import { PRODUCT } from "@/lib/product";

const P = PRODUCT;

const bookPages = [
  { image: "/examples/book-1.png", chapter: "Chapter one", line: "A silver moonbeam begins a bedtime dream." },
  { image: "/examples/book-2.png", chapter: "Chapter two", line: "Up through the clouds, a new world opens." },
  { image: "/examples/book-3.png", chapter: "Chapter three", line: "A little dream-cloud needs a brave friend." },
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
              <Link href="/create" className="mtt-button mtt-button--ink">See their free preview <span aria-hidden="true">→</span></Link>
              <a href="#inside-the-book" className="mtt-text-link">Open the book <span aria-hidden="true">↓</span></a>
            </div>
            <p className="mtt-hero__note">See the first {P.freePreviewPages} pages before you decide. No card required. <Link href="/childrens-data">Photos are deleted within {P.photoDeletionHours} hours.</Link></p>
          </div>

          <div className="mtt-hero__books" aria-label="A personalised My Tiny Tales storybook">
            <div className="mtt-hero__sun" aria-hidden="true" />
            <div className="mtt-hero__book-object">
              <BookMockup3D coverImg="/examples/book-1.png" width={292} height={382} animate />
            </div>
            <div className="mtt-hero__leaf mtt-hero__leaf--one" aria-hidden="true" />
            <div className="mtt-hero__leaf mtt-hero__leaf--two" aria-hidden="true" />
            <p className="mtt-hero__caption">A real My Tiny Tales story, made to linger over.</p>
          </div>
        </section>

        <section className="mtt-introduction" aria-labelledby="introduction-title">
          <p className="mtt-kicker">Made for the ones you love most</p>
          <h2 id="introduction-title">Turn a favourite photo into the story they ask for <em>again and again.</em></h2>
          <div className="mtt-introduction__rule" aria-hidden="true" />
          <p>Choose an adventure, tell us a little about your child, and we will shape a one-of-a-kind illustrated tale around them. The magic is not the technology. It is seeing themselves at the centre of the story.</p>
        </section>

        <section className="mtt-transformation" id="how-it-works" aria-labelledby="transformation-title">
          <div className="mtt-transformation__heading">
            <p className="mtt-kicker">How a tale begins</p>
            <h2 id="transformation-title">One favourite photo becomes their whole story.</h2>
            <p>Start with the child you know. Their familiar face and name are carried into an illustrated adventure, then gathered into a book for the shelf.</p>
          </div>
          <ol className="mtt-transformation__sequence">
            <li className="mtt-transformation__photo">
              <span className="mtt-transformation__number">01</span>
              <div className="mtt-photo-frame" aria-label="Your child's photo">
                <span>A favourite<br />photo</span>
                <small>The one you choose</small>
              </div>
              <h3>Their photo</h3>
              <p>You begin with a clear picture of your little reader.</p>
            </li>
            <li className="mtt-transformation__arrow" aria-hidden="true">→</li>
            <li>
              <span className="mtt-transformation__number">02</span>
              <figure className="mtt-transformation__art">
                <Image src="/examples/book-2.png" alt="A child illustrated in a warm bedtime dream scene" fill sizes="(max-width: 720px) 82vw, 22vw" />
              </figure>
              <h3>Their character</h3>
              <p>An illustrated character carries the story forward.</p>
            </li>
            <li className="mtt-transformation__arrow" aria-hidden="true">→</li>
            <li>
              <span className="mtt-transformation__number">03</span>
              <div className="mtt-transformation__book">
                <BookMockup3D coverImg="/examples/book-6.png" width={126} height={164} animate={false} />
              </div>
              <h3>Their book</h3>
              <p>A story to read close now and return to for years.</p>
            </li>
          </ol>
          <Link href="/create" className="mtt-text-link mtt-text-link--strong">Create their free preview <span aria-hidden="true">→</span></Link>
        </section>

        <section className="mtt-open-book" id="inside-the-book" aria-labelledby="open-book-title">
          <div className="mtt-open-book__book">
            <div className="mtt-open-book__page mtt-open-book__page--text">
              <span>Inside a My Tiny Tales book</span>
              <p>Each scene is told in words on the left, with its illustration on the right.</p>
              <small>A facing-page story spread</small>
            </div>
            <div className="mtt-open-book__page mtt-open-book__page--art">
              <Image src="/examples/book-3.png" alt="An illustration from the current Off to Dreamland example book" fill sizes="(max-width: 720px) 46vw, 31vw" />
            </div>
          </div>
          <div className="mtt-open-book__copy">
            <p className="mtt-kicker">Inside a real story</p>
            <h2 id="open-book-title">Words on the left. Their matching illustration on the right.</h2>
            <p>Every finished story is read as a facing-page spread. The illustration shown is from the current <em>Off to Dreamland</em> example book.</p>
            <a href="#story-worlds" className="mtt-text-link">See a few pages <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="mtt-worlds" id="story-worlds" aria-labelledby="worlds-title">
          <div className="mtt-worlds__heading">
            <p className="mtt-kicker">Eight illustrated scenes</p>
            <h2 id="worlds-title">One complete adventure, from first page to last.</h2>
          </div>
          <div className="mtt-worlds__grid">
            {bookPages.map((page, index) => (
              <figure className={`mtt-world mtt-world--${index + 1}`} key={page.chapter}>
                <div className="mtt-world__image"><Image src={page.image} alt={page.line} fill sizes="(max-width: 720px) 78vw, 30vw" /></div>
                <figcaption>
                  <p className="mtt-world__number">{page.chapter}</p>
                  <p>{page.line}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mtt-keepsake" id="keepsake" aria-labelledby="keepsake-title">
          <div className="mtt-keepsake__image">
            <div className="mtt-keepsake__book-object">
              <BookMockup3D coverImg="/examples/book-6.png" width={292} height={382} animate={false} />
            </div>
            <p className="mtt-keepsake__ribbon">For tonight’s reading—and the bookshelf that holds the years.</p>
          </div>
          <div className="mtt-keepsake__copy">
            <p className="mtt-kicker">Choose their keepsake</p>
            <h2 id="keepsake-title">A story to keep, in the way that suits your family.</h2>
            <p>Keep their complete story as a digital book, or choose a printed copy made for bedtime piles, little hands, and family shelves.</p>
            <dl className="mtt-keepsake__options">
              <div><dt>{P.pricing.digital.name}</dt><dd>{P.pricing.digital.label}</dd><p>A complete digital storybook, ready to keep and print at home.</p></div>
              <div><dt>{P.pricing.print.name}</dt><dd>{P.pricing.print.label}</dd><p>{P.print.pageCount}-page {P.print.cover}, {P.print.sizeIn}. Includes the digital storybook. Delivered in {P.print.delivery}.</p></div>
            </dl>
            <Link href="/create" className="mtt-button mtt-button--paper">See their free preview <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="mtt-reassurance" aria-labelledby="reassurance-title">
          <p className="mtt-kicker">Made with care</p>
          <h2 id="reassurance-title">A gentle beginning, and a promise after the book arrives.</h2>
          <div className="mtt-reassurance__items">
            <p><strong>Your free preview</strong>Read the first {P.freePreviewPages} pages before you choose a book. No card required.</p>
            <p><strong>{P.refundDays}-day happiness promise</strong>If something is not right, we re-create or reprint it to make it right.</p>
            <p><strong>Photos treated with care</strong>We do not keep your photo on our own servers. It is automatically deleted from our illustration provider within {P.photoDeletionHours} hours and never used to train models.</p>
          </div>
        </section>

        <section className="mtt-questions" aria-labelledby="questions-title">
          <div>
            <p className="mtt-kicker">A few gentle questions</p>
            <h2 id="questions-title">Wondering how it works?</h2>
          </div>
          <div className="mtt-questions__answers">
            <p><strong>Will the character really look like my child?</strong>We use their photo as a reference to draw a character who is clearly recognisable as your little one.</p>
            <p><strong>What photo works best?</strong>A clear, front-facing photo in good light gives the story the best place to begin.</p>
            <Link href="/faq" className="mtt-text-link">Read all the questions <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="mtt-quiet-cta" aria-labelledby="cta-title">
          <p className="mtt-kicker">A place for them in the story</p>
          <h2 id="cta-title">The next page has their name on it.</h2>
          <Link href="/create" className="mtt-button mtt-button--ink">See their free preview <span aria-hidden="true">→</span></Link>
          <p>First {P.freePreviewPages} pages free. No card required.</p>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

