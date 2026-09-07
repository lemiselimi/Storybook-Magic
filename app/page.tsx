"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BookMockup3D from "./components/BookMockup3D";
import { PRODUCT } from "@/lib/product";

// ── Product facts (single source of truth) ──────────────────────────────────
const P = PRODUCT;
const COVERS = ["/examples/example-1.webp", "/examples/example-2.webp", "/examples/example-3.webp", "/examples/example-4.webp"];

// Real sample scenes shown as book imagery (these are actual book illustrations,
// not decoration). No invented reviews or claims.
const SCENES = [
  { img: "/examples/example-1.webp", tag: "The Big Adventure", line: "Your child discovers a hidden world and has to be brave to save the day." },
  { img: "/examples/example-2.webp", tag: "To The Stars", line: "A mission across the cosmos, with kindness as their secret power." },
  { img: "/examples/example-3.webp", tag: "Dragon Tamer", line: "A frightened dragon needs help, and only one small hero will do." },
  { img: "/examples/example-4.webp", tag: "Deep Blue", line: "An underwater mystery that only they can solve." },
];

const STEPS = [
  { n: "01", t: "Show us your little hero", d: "Start with one clear photo. We use it to draw a character who truly looks like them." },
  { n: "02", t: "Choose their adventure", d: "Pick a story world, then add their name and age so the tale is theirs alone." },
  { n: "03", t: "Preview their story", d: `See the first ${P.freePreviewPages} pages free, ${P.previewTime} later. No card, no commitment.` },
  { n: "04", t: "Keep the book forever", d: "Download it instantly, or order a printed keepsake for the shelf." },
];

const FAQS = [
  { q: "Will the character really look like my child?", a: "Yes. We draw the character from your photo, keeping their features so they are clearly recognisable as your little one, illustrated in our warm cinematic 3D storybook style." },
  { q: "What photo works best?", a: "A clear, well-lit, front-facing photo. The better the photo, the more the character resembles your child." },
  { q: "How long does it take?", a: `Your free preview is ready in ${P.previewTime}. The story is written first, then every scene is illustrated.` },
  { q: "Is my child's photo safe?", a: `Yes. We never store your photo on our own servers, it is never used to train any model, and it is automatically deleted within ${P.photoDeletionHours} hours.` },
];

const FOOTER_LINKS: Record<string, [string, string][]> = {
  Explore: [["Examples", "#examples"], ["How it works", "#how"], ["Pricing", "#pricing"], ["FAQ", "/faq"]],
  Company: [["About", "/contact"], ["Contact", "/contact"], ["Print guide", "/print-guide"]],
  Legal: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "/refunds"], ["Children's Data", "/childrens-data"], ["Cookie settings", "__cookie__"]],
};

function StripeMark() { return <svg height="18" viewBox="0 0 60 25" aria-hidden="true"><rect width="60" height="25" rx="4" fill="#635BFF" opacity=".1" /><path d="M12 9.5c0-1.1.9-1.5 2.3-1.5 2 0 4.6.6 6.6 1.7V6c-2-.8-4-1-6.6-1C10.5 5 8 7 8 10c0 4.5 6.2 3.8 6.2 5.7 0 1.3-1.1 1.7-2.7 1.7-2.3 0-5.3-.9-7.5-2.2V19c2.5 1 5 1.5 7.5 1.5 3.8 0 6.5-1.8 6.5-5.2C18 10.8 12 11.6 12 9.5z" fill="#635BFF" /></svg>; }

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", h);
    return () => { window.removeEventListener("scroll", onScroll); mq.removeEventListener("change", h); };
  }, []);

  useEffect(() => {
    if (reduced) { document.querySelectorAll(".reveal").forEach(el => el.classList.add("in")); return; }
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [reduced]);

  useEffect(() => { document.body.style.overflow = menuOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menuOpen]);

  return (
    <div className="mtt">
      <style>{css}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className={`nav ${scrolled ? "nav--solid" : ""}`}>
        <a href="#top" className="brand" aria-label="My Tiny Tales home">
          <span className="brand__mark" aria-hidden="true">✷</span>
          <span className="brand__name">My Tiny Tales</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          <a href="#examples">Examples</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <Link href="/faq">FAQ</Link>
        </nav>
        <Link href="/create" className="btn btn--sm nav__cta">See their preview</Link>
        <button className="nav__burger" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
          <span /><span /><span />
        </button>
      </header>

      {menuOpen && (
        <div className="menu" onClick={() => setMenuOpen(false)}>
          <a href="#examples">Examples</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <Link href="/faq">FAQ</Link>
          <Link href="/create" className="btn">See their free preview</Link>
        </div>
      )}

      <main id="top">
        {/* ── 1. HERO ─────────────────────────────────────── */}
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">A personalised storybook</p>
            <h1 className="display">A storybook made <em>just for them.</em></h1>
            <p className="hero__sub">Their face. Their name. Their adventure.</p>
            <Link href="/create" className="btn btn--lg">See their free preview <span aria-hidden="true">→</span></Link>
            <p className="hero__micro">{P.freePreviewPages} pages free · No credit card · Ready in {P.previewTime}</p>
          </div>
          <div className="hero__book">
            <div className={reduced ? "" : "floaty"}>
              <BookMockup3D coverImg={COVERS[0]} width={280} height={366} animate={!reduced} />
            </div>
            <p className="hero__caption">An open spread from a real My Tiny Tales book</p>
          </div>
        </section>

        {/* ── 2. EMOTIONAL INTRODUCTION ───────────────────── */}
        <section className="intro">
          <div className="intro__head reveal">
            <h2 className="display display--2">What if they could step inside their favourite story?</h2>
          </div>
          <div className="intro__grid">
            <figure className="intro__fig reveal">
              <img src={SCENES[0].img} alt="A child illustrated as the hero of an adventure" loading="lazy" />
              <figcaption>Their face becomes the hero.</figcaption>
            </figure>
            <figure className="intro__fig reveal">
              <img src={SCENES[1].img} alt="A personalised storybook scene set among the stars" loading="lazy" />
              <figcaption>Their name is woven through the story.</figcaption>
            </figure>
            <figure className="intro__fig reveal">
              <img src={SCENES[2].img} alt="A storybook scene with a friendly dragon" loading="lazy" />
              <figcaption>Their adventure becomes a book they keep.</figcaption>
            </figure>
          </div>
        </section>

        {/* ── 3. REAL BOOK EXAMPLE ────────────────────────── */}
        <section id="examples" className="showcase">
          <div className="showcase__intro reveal">
            <p className="eyebrow eyebrow--gold">Inside a book</p>
            <h2 className="display display--2">Eight illustrated chapters, start to finish.</h2>
            <p className="lede">Every book tells a complete {P.storyScenes}-scene story, illustrated in a warm, cinematic 3D storybook style, with your child at the centre of every page.</p>
          </div>
          <div className="spreads">
            {SCENES.map((s, i) => (
              <figure key={i} className={`spread reveal ${i % 2 ? "spread--r" : ""}`}>
                <div className="spread__img"><img src={s.img} alt={`${s.tag} storybook scene`} loading="lazy" /></div>
                <figcaption className="spread__cap">
                  <span className="spread__tag">{s.tag}</span>
                  <p>{s.line}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── 4. HOW IT WORKS ─────────────────────────────── */}
        <section id="how" className="how">
          <div className="how__head reveal">
            <p className="eyebrow eyebrow--gold">How it works</p>
            <h2 className="display display--2">From a photo to a keepsake.</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.n} className="step reveal">
                <div className="step__art" aria-hidden="true">
                  {i < 3 ? <img src={COVERS[i]} alt="" loading="lazy" /> : <BookMockup3D coverImg={COVERS[3]} width={120} height={160} animate={false} />}
                </div>
                <span className="step__n">{s.n}</span>
                <h3 className="step__t">{s.t}</h3>
                <p className="step__d">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 5. TRANSFORMATION ───────────────────────────── */}
        <section className="transform">
          <div className="transform__head reveal">
            <h2 className="display display--2">One photo becomes their whole story.</h2>
          </div>
          <div className="chain">
            <div className="chain__item reveal">
              <div className="chain__photo" aria-hidden="true"><span>A photo of them</span></div>
              <span className="chain__label">Photo</span>
            </div>
            <span className="chain__arrow" aria-hidden="true">→</span>
            <div className="chain__item reveal">
              <div className="chain__img"><img src={COVERS[0]} alt="Illustrated character drawn from the photo" loading="lazy" /></div>
              <span className="chain__label">Character</span>
            </div>
            <span className="chain__arrow" aria-hidden="true">→</span>
            <div className="chain__item reveal">
              <div className="chain__story"><p>&ldquo;And so {`{their name}`} stepped through the door, braver than they had ever been&hellip;&rdquo;</p></div>
              <span className="chain__label">Story</span>
            </div>
            <span className="chain__arrow" aria-hidden="true">→</span>
            <div className="chain__item reveal">
              <div className="chain__book"><BookMockup3D coverImg={COVERS[0]} width={120} height={160} animate={false} /></div>
              <span className="chain__label">Book</span>
            </div>
          </div>
        </section>

        {/* ── 6. BRAND STATEMENT ──────────────────────────── */}
        <section className="statement">
          <div className="reveal">
            <h2 className="display display--big">Not just personalised.<br /><em>Personal.</em></h2>
            <p className="statement__p">There is a moment when a child turns the page, sees their own face looking back, and realises the hero of the story is them. That feeling, that they are brave, that they matter, that their story is worth telling, is what we make. It just happens to arrive as a beautiful book.</p>
          </div>
        </section>

        {/* ── 7. PRICING ──────────────────────────────────── */}
        <section id="pricing" className="pricing">
          <div className="pricing__head reveal">
            <p className="eyebrow eyebrow--gold">Choose their keepsake</p>
            <h2 className="display display--2">Two ways to keep their story.</h2>
          </div>
          <div className="plans">
            <div className="plan reveal">
              <h3 className="plan__name">{P.pricing.digital.name}</h3>
              <p className="plan__price">{P.pricing.digital.label}</p>
              <p className="plan__sub">A print-ready book, yours in {P.previewTime}.</p>
              <ul className="plan__list">
                <li>{P.storyScenes} illustrated scenes, personalised throughout</li>
                <li>Instant high-resolution PDF download</li>
                <li>Print at home, as many copies as you like</li>
                <li>Shareable link for family</li>
              </ul>
              <Link href="/create" className="btn btn--ghost plan__cta">Start their book</Link>
            </div>

            <div className="plan plan--feature reveal">
              <span className="plan__ribbon">Most loved</span>
              <div className="plan__book"><BookMockup3D coverImg={COVERS[2]} width={150} height={200} animate={!reduced} /></div>
              <h3 className="plan__name">{P.pricing.print.name}</h3>
              <p className="plan__price">{P.pricing.print.label}</p>
              <p className="plan__sub">Everything in Digital, plus a book for the shelf.</p>
              <ul className="plan__list">
                <li>Premium {P.print.cover}, {P.print.sizeIn}</li>
                <li>{P.print.pageCount} pages on {P.print.paper}</li>
                <li>Printed and delivered in {P.print.delivery}</li>
                <li>A keepsake they will grow up with</li>
              </ul>
              <Link href="/create" className="btn plan__cta">Create their book</Link>
            </div>
          </div>
          <p className="promise reveal">
            <span aria-hidden="true">✷</span> Our {P.refundDays}-day happiness promise: if something is not right, we re-create or reprint it to make it right.
          </p>
        </section>

        {/* ── 8. PRIVACY ──────────────────────────────────── */}
        <section className="trust">
          <div className="trust__inner reveal">
            <p className="eyebrow eyebrow--gold">Made for families</p>
            <h2 className="display display--2">Your child's photo is treated with care.</h2>
            <div className="trust__grid">
              <div><h3>Never stored by us</h3><p>We do not keep your photo on our own servers. It is used only as a reference to draw the character.</p></div>
              <div><h3>Deleted within {P.photoDeletionHours} hours</h3><p>The reference photo is automatically deleted from our illustration provider within {P.photoDeletionHours} hours of upload.</p></div>
              <div><h3>Never used to train models</h3><p>Your photo is never sold, never shared for advertising, and never used to train any model.</p></div>
            </div>
            <p className="trust__link"><Link href="/childrens-data">Read our full children's data commitment →</Link></p>
          </div>
        </section>

        {/* ── 9. FAQ ──────────────────────────────────────── */}
        <section className="faq">
          <div className="faq__head reveal">
            <h2 className="display display--2">Questions, answered warmly.</h2>
          </div>
          <div className="faq__list reveal">
            {FAQS.map((f, i) => (
              <div key={i} className={`qa ${openFaq === i ? "qa--open" : ""}`}>
                <button className="qa__q" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span><span className="qa__mark" aria-hidden="true">{openFaq === i ? "–" : "+"}</span>
                </button>
                {openFaq === i && <p className="qa__a">{f.a}</p>}
              </div>
            ))}
          </div>
          <p className="faq__more"><Link href="/faq">See all questions →</Link></p>
        </section>

        {/* ── 10. FINAL CTA ───────────────────────────────── */}
        <section className="final reveal">
          <h2 className="display display--2">Their story is waiting.</h2>
          <Link href="/create" className="btn btn--lg">See their free preview <span aria-hidden="true">→</span></Link>
          <p className="final__micro">No credit card required.</p>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="foot">
        <div className="foot__grid">
          <div className="foot__brand">
            <div className="brand"><span className="brand__mark" aria-hidden="true">✷</span><span className="brand__name">My Tiny Tales</span></div>
            <p>Personalised storybooks starring your child. Made with care, treasured for years.</p>
            <p className="foot__made">Made in the USA</p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([col, links]) => (
            <div key={col} className="foot__col">
              <h4>{col}</h4>
              {links.map(([label, href]) =>
                href === "__cookie__" ? (
                  <button key={label} className="foot__link" onClick={() => window.dispatchEvent(new Event("open_cookie_settings"))}>{label}</button>
                ) : href.startsWith("/") ? (
                  <Link key={label} href={href} className="foot__link">{label}</Link>
                ) : (
                  <a key={label} href={href} className="foot__link">{label}</a>
                )
              )}
            </div>
          ))}
        </div>
        <div className="foot__bottom">
          <p>© {new Date().getFullYear()} My Tiny Tales. All rights reserved.</p>
          <div className="foot__pay"><StripeMark /><span>Secure checkout by Stripe</span></div>
        </div>
      </footer>
    </div>
  );
}

// ── Design system ────────────────────────────────────────────────────────────
const css = `
.mtt{
  --paper:#FBF6EC; --paper-2:#F2E9D8; --ink:#26313D; --ink-soft:#5C6672;
  --gold:#C0863A; --coral:#D2694B; --line:rgba(38,49,61,.12);
  background:var(--paper); color:var(--ink);
  font-family:var(--font-inter,'Outfit',system-ui,sans-serif);
  -webkit-font-smoothing:antialiased; overflow-x:hidden;
}
.mtt em{font-style:italic;color:var(--coral)}
.display{font-family:var(--font-fraunces,Georgia,serif);font-weight:600;letter-spacing:-.01em;line-height:1.08;margin:0}
.display--2{font-size:clamp(28px,4.4vw,46px);line-height:1.12}
.display--big{font-size:clamp(40px,8vw,88px);line-height:1.02}
.eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft);font-weight:600;margin:0 0 16px}
.eyebrow--gold{color:var(--gold)}
.lede{font-size:clamp(16px,2vw,19px);line-height:1.7;color:var(--ink-soft);max-width:56ch}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:var(--paper);
  font-weight:600;font-size:16px;text-decoration:none;padding:14px 26px;border-radius:12px;border:1px solid var(--ink);
  cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
.btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(38,49,61,.22)}
.btn:active{transform:translateY(0)}
.btn--lg{font-size:18px;padding:18px 34px}
.btn--sm{font-size:14px;padding:10px 18px;border-radius:10px}
.btn--ghost{background:transparent;color:var(--ink);border:1px solid rgba(38,49,61,.28)}
.btn--ghost:hover{background:rgba(38,49,61,.05);box-shadow:none}
a:focus-visible,button:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:6px}

/* Reveal */
.reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s cubic-bezier(.16,1,.3,1)}
.reveal.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.reveal{opacity:1!important;transform:none!important}.floaty{animation:none!important}}

/* Nav */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;gap:20px;
  padding:16px clamp(20px,5vw,56px);transition:background .3s,box-shadow .3s,border-color .3s;border-bottom:1px solid transparent}
.nav--solid{background:rgba(251,246,236,.9);backdrop-filter:blur(12px);border-bottom-color:var(--line)}
.brand{display:inline-flex;align-items:center;gap:9px;text-decoration:none;color:var(--ink)}
.brand__mark{color:var(--gold);font-size:18px}
.brand__name{font-family:var(--font-fraunces,Georgia,serif);font-weight:600;font-size:19px}
.nav__links{margin-left:auto;display:flex;gap:28px}
.nav__links a{color:var(--ink);text-decoration:none;font-size:15px;font-weight:500;opacity:.82}
.nav__links a:hover{opacity:1;color:var(--coral)}
.nav__cta{margin-left:4px}
.nav__burger{display:none;margin-left:auto;background:none;border:none;flex-direction:column;gap:5px;cursor:pointer;padding:6px}
.nav__burger span{width:24px;height:2px;background:var(--ink);border-radius:2px}
.menu{position:fixed;inset:0;z-index:99;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px}
.menu a{font-family:var(--font-fraunces,Georgia,serif);font-size:26px;color:var(--ink);text-decoration:none}

/* Hero */
.hero{display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:40px;
  max-width:1200px;margin:0 auto;padding:150px clamp(20px,5vw,56px) 90px}
.hero__copy .display{font-size:clamp(40px,6vw,68px)}
.hero__sub{font-family:var(--font-fraunces,Georgia,serif);font-size:clamp(19px,2.6vw,26px);color:var(--ink-soft);margin:20px 0 34px;font-style:italic}
.hero__micro{margin-top:20px;color:var(--ink-soft);font-size:14px}
.hero__book{display:flex;flex-direction:column;align-items:center;gap:18px}
.hero__caption{font-size:12.5px;color:var(--ink-soft);letter-spacing:.02em}
.floaty{animation:floaty 6s ease-in-out infinite alternate}
@keyframes floaty{from{transform:translateY(0)}to{transform:translateY(-10px)}}

/* Intro */
.intro{max-width:1180px;margin:0 auto;padding:40px clamp(20px,5vw,56px) 90px}
.intro__head{max-width:20ch;margin:0 0 48px}
.intro__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.intro__fig{margin:0}
.intro__fig img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px;box-shadow:0 20px 44px rgba(38,49,61,.16)}
.intro__fig figcaption{margin-top:16px;font-family:var(--font-fraunces,Georgia,serif);font-size:18px;color:var(--ink)}

/* Showcase */
.showcase{background:var(--paper-2);padding:96px clamp(20px,5vw,56px)}
.showcase__intro{max-width:1120px;margin:0 auto 56px}
.showcase__intro .lede{margin-top:16px}
.spreads{max-width:1120px;margin:0 auto;display:flex;flex-direction:column;gap:64px}
.spread{display:grid;grid-template-columns:1.2fr .8fr;align-items:center;gap:44px;margin:0}
.spread--r{grid-template-columns:.8fr 1.2fr}
.spread--r .spread__img{order:2}
.spread__img img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px;box-shadow:0 28px 60px rgba(38,49,61,.2)}
.spread__tag{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);font-weight:700}
.spread__cap p{font-family:var(--font-fraunces,Georgia,serif);font-size:clamp(20px,2.4vw,28px);line-height:1.35;color:var(--ink);margin:14px 0 0}

/* How */
.how{max-width:1180px;margin:0 auto;padding:96px clamp(20px,5vw,56px)}
.how__head{margin:0 0 56px}
.steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:32px}
.step{position:relative}
.step__art{height:150px;display:flex;align-items:flex-end;justify-content:flex-start;margin-bottom:22px}
.step__art img{width:118px;height:150px;object-fit:cover;border-radius:10px;box-shadow:0 14px 30px rgba(38,49,61,.18)}
.step__n{font-family:var(--font-fraunces,Georgia,serif);font-size:15px;color:var(--gold);font-weight:700}
.step__t{font-family:var(--font-fraunces,Georgia,serif);font-size:20px;font-weight:600;margin:6px 0 8px}
.step__d{color:var(--ink-soft);font-size:15px;line-height:1.65;margin:0}

/* Transform */
.transform{background:var(--paper-2);padding:96px clamp(20px,5vw,56px)}
.transform__head{max-width:1120px;margin:0 auto 56px;text-align:center}
.chain{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:20px;flex-wrap:wrap}
.chain__item{display:flex;flex-direction:column;align-items:center;gap:14px;width:180px}
.chain__photo{width:150px;height:180px;border-radius:12px;border:2px dashed rgba(38,49,61,.28);display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.5)}
.chain__photo span{color:var(--ink-soft);font-size:13px}
.chain__img img,.chain__book{width:150px;height:180px;object-fit:cover}
.chain__img img{border-radius:12px;box-shadow:0 16px 34px rgba(38,49,61,.2)}
.chain__book{display:flex;align-items:center;justify-content:center}
.chain__story{width:150px;height:180px;border-radius:12px;background:#FCFAF4;box-shadow:0 16px 34px rgba(38,49,61,.14);display:flex;align-items:center;padding:18px}
.chain__story p{font-family:var(--font-fraunces,Georgia,serif);font-size:14px;line-height:1.5;color:var(--ink);margin:0}
.chain__label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-weight:700}
.chain__arrow{color:var(--gold);font-size:24px}

/* Statement */
.statement{max-width:960px;margin:0 auto;padding:110px clamp(20px,5vw,56px);text-align:center}
.statement__p{font-size:clamp(17px,2.1vw,21px);line-height:1.75;color:var(--ink-soft);max-width:60ch;margin:28px auto 0}

/* Pricing */
.pricing{background:var(--ink);color:var(--paper);padding:100px clamp(20px,5vw,56px)}
.pricing .eyebrow{color:#E7C79A}
.pricing__head{max-width:1080px;margin:0 auto 56px;text-align:center}
.pricing__head .display{color:var(--paper)}
.plans{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start}
.plan{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:38px 34px}
.plan--feature{background:var(--paper);color:var(--ink);border-color:transparent;position:relative;box-shadow:0 30px 70px rgba(0,0,0,.34)}
.plan__ribbon{position:absolute;top:-13px;left:34px;background:var(--coral);color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:5px 14px;border-radius:20px}
.plan__book{display:flex;justify-content:center;margin:0 0 20px}
.plan__name{font-family:var(--font-fraunces,Georgia,serif);font-size:22px;font-weight:600;margin:0 0 4px}
.plan__price{font-family:var(--font-fraunces,Georgia,serif);font-size:40px;font-weight:700;margin:0}
.plan__sub{opacity:.7;font-size:14px;margin:6px 0 22px}
.plan__list{list-style:none;margin:0 0 28px;padding:0;display:flex;flex-direction:column;gap:12px}
.plan__list li{position:relative;padding-left:26px;font-size:15px;line-height:1.5}
.plan__list li::before{content:"✷";position:absolute;left:0;color:var(--gold)}
.plan__cta{width:100%;justify-content:center}
.plan--feature .btn{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.promise{max-width:640px;margin:40px auto 0;text-align:center;color:rgba(251,246,236,.72);font-size:14px;line-height:1.7}
.promise span{color:#E7C79A}

/* Trust */
.trust{padding:100px clamp(20px,5vw,56px)}
.trust__inner{max-width:1080px;margin:0 auto}
.trust__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:36px;margin:44px 0 0}
.trust__grid h3{font-family:var(--font-fraunces,Georgia,serif);font-size:19px;font-weight:600;margin:0 0 8px}
.trust__grid p{color:var(--ink-soft);font-size:15px;line-height:1.65;margin:0}
.trust__link{margin-top:36px}
.trust__link a{color:var(--coral);text-decoration:none;font-weight:600}

/* FAQ */
.faq{max-width:820px;margin:0 auto;padding:90px clamp(20px,5vw,56px)}
.faq__head{margin:0 0 36px}
.qa{border-top:1px solid var(--line)}
.qa:last-child{border-bottom:1px solid var(--line)}
.qa__q{width:100%;display:flex;justify-content:space-between;gap:20px;align-items:center;background:none;border:none;
  padding:22px 0;text-align:left;cursor:pointer;font-family:var(--font-fraunces,Georgia,serif);font-size:18px;color:var(--ink)}
.qa__mark{color:var(--gold);font-size:22px;flex-shrink:0}
.qa__a{margin:0 0 22px;color:var(--ink-soft);font-size:15.5px;line-height:1.7;max-width:64ch}
.faq__more{margin-top:32px}
.faq__more a{color:var(--coral);text-decoration:none;font-weight:600}

/* Final */
.final{text-align:center;padding:110px clamp(20px,5vw,56px);background:var(--paper-2)}
.final .display{margin-bottom:32px}
.final__micro{margin-top:18px;color:var(--ink-soft);font-size:14px}

/* Footer */
.foot{border-top:1px solid var(--line);padding:70px clamp(20px,5vw,56px) 44px}
.foot__grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:44px}
.foot__brand p{color:var(--ink-soft);font-size:14px;line-height:1.7;max-width:30ch;margin:14px 0 0}
.foot__made{font-size:13px}
.foot__col h4{font-family:var(--font-fraunces,Georgia,serif);font-size:14px;font-weight:600;margin:0 0 16px}
.foot__link{display:block;background:none;border:none;padding:0 0 11px;color:var(--ink-soft);font-size:14px;text-decoration:none;cursor:pointer;text-align:left;font-family:inherit}
.foot__link:hover{color:var(--coral)}
.foot__bottom{max-width:1120px;margin:44px auto 0;padding-top:22px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}
.foot__bottom p{color:var(--ink-soft);font-size:12.5px;margin:0}
.foot__pay{display:flex;align-items:center;gap:10px;color:var(--ink-soft);font-size:12.5px}

/* ── Mobile ─────────────────────────────────────────────── */
@media (max-width:900px){
  .spread,.spread--r{grid-template-columns:1fr;gap:22px}
  .spread--r .spread__img{order:0}
  .steps{grid-template-columns:1fr 1fr;gap:36px 28px}
  .intro__grid{grid-template-columns:1fr 1fr}
  .intro__grid .intro__fig:last-child{grid-column:1 / -1}
  .trust__grid{grid-template-columns:1fr;gap:28px}
  .plans{grid-template-columns:1fr;max-width:440px}
  .foot__grid{grid-template-columns:1fr 1fr;gap:36px 24px}
  .foot__brand{grid-column:1 / -1}
}
@media (max-width:768px){
  .nav__links,.nav__cta{display:none}
  .nav__burger{display:flex}
  .hero{grid-template-columns:1fr;text-align:center;padding:120px 22px 70px;gap:44px}
  .hero__copy{order:2}
  .hero__book{order:1}
  .intro__head{margin-inline:auto;text-align:center}
  .transform__head{text-align:center}
  .steps{grid-template-columns:1fr;gap:32px}
  .step__art{justify-content:center}
  .chain{flex-direction:column}
  .chain__arrow{transform:rotate(90deg)}
}
@media (max-width:420px){ .intro__grid{grid-template-columns:1fr} }
`;
