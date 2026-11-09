"use client";

import Link from "next/link";
import { useState } from "react";
import Container from "./Container";
import { business } from "@/lib/content";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/property-records", label: "Records" },
  { href: "/examples", label: "Examples" },
  { href: "/payments", label: "Payments" },
  { href: "/downloads", label: "Forms" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <Container className="flex h-16 max-w-6xl items-center justify-between gap-4">
        <Link
          href="/"
          className="whitespace-nowrap font-display text-lg font-semibold text-brand-800"
          onClick={() => setOpen(false)}
        >
          {business.shortName}
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-sm text-foreground-muted transition-colors hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="whitespace-nowrap rounded-sm bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
          >
            Request a quote
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center text-brand-800 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            {open ? (
              <path d="M4 4L18 18M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6H19M3 11H19M3 16H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </Container>

      {open && (
        <nav id="mobile-nav" className="border-t border-border bg-background lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sm px-2 py-2.5 text-base text-foreground-muted hover:bg-surface hover:text-brand-700"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-2 rounded-sm bg-brand-700 px-4 py-3 text-center text-base font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Request a quote
            </Link>
          </Container>
        </nav>
      )}
    </header>
  );
}
