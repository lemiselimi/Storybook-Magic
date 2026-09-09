"use client";

import Link from "next/link";
import { PRODUCT } from "@/lib/product";

const footerGroups = [
  { title: "Discover", links: [["How it works", "#how-it-works"], ["Inside the book", "#inside-the-book"], ["The keepsake", "#keepsake"], ["Examples", "#story-worlds"]] },
  { title: "Help", links: [["Questions", "/faq"], ["Print guide", "/print-guide"], ["Contact", "/contact"]] },
  { title: "Details", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "/refunds"], ["Children's data", "/childrens-data"]] },
];

export default function MarketingFooter() {
  return (
    <footer className="mtt-footer">
      <div className="mtt-footer__inner">
        <div className="mtt-footer__intro">
          <span className="mtt-wordmark mtt-wordmark--footer"><span className="mtt-wordmark__mark" aria-hidden="true">✦</span>{PRODUCT.name}</span>
          <p>Personalised stories made to be read close, kept nearby, and returned to often.</p>
          <a href={`mailto:${PRODUCT.email}`}>{PRODUCT.email}</a>
        </div>
        {footerGroups.map((group) => (
          <div className="mtt-footer__group" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, href]) => href.startsWith("/")
              ? <Link key={href} href={href}>{label}</Link>
              : <a key={href} href={href}>{label}</a>)}
          </div>
        ))}
      </div>
      <div className="mtt-footer__bottom">
        <span>© {new Date().getFullYear()} My Tiny Tales</span>
        <span>Made for their bookshelf.</span>
        <button className="mtt-footer__cookie" type="button" onClick={() => window.dispatchEvent(new Event("open_cookie_settings"))}>Cookie settings</button>
      </div>
    </footer>
  );
}

