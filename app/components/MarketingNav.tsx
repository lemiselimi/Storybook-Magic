"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#inside-the-book", label: "Inside the book" },
  { href: "#keepsake", label: "The keepsake" },
];

export default function MarketingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="mtt-nav">
      <div className="mtt-nav__inner">
        <Link href="/" className="mtt-wordmark" aria-label="My Tiny Tales home">
          <span className="mtt-wordmark__mark" aria-hidden="true">✦</span>
          <span>My Tiny Tales</span>
        </Link>

        <nav className="mtt-nav__links" aria-label="Primary navigation">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>

        <Link href="/create" className="mtt-nav__cta">See their free preview</Link>

        <button
          className="mtt-nav__toggle"
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span /><span />
        </button>
      </div>

      {isOpen && (
        <nav className="mtt-nav__mobile" aria-label="Mobile navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setIsOpen(false)}>{link.label}</a>
          ))}
          <Link href="/create" onClick={() => setIsOpen(false)}>See their free preview <span aria-hidden="true">→</span></Link>
        </nav>
      )}
    </header>
  );
}

