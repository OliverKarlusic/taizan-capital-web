"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#mandate", label: "The Firm" },
  { href: "#philosophy", label: "Philosophy" },
  { href: "#approach", label: "Approach" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#insights", label: "Insights" },
  { href: "#about", label: "About" },
];

/**
 * Brand lockup: the ensō emblem beside a live-type wordmark.
 *
 * The emblem is the supplied brand asset, cropped to the mark and re-encoded
 * (1.7 MB PNG → 64 KB WebP, with a 2x for retina). The wordmark stays as
 * live type rather than the artwork's baked-in lettering — that lettering is
 * malformed in the source file and would be unreadable at navbar size, and
 * type also scales losslessly, weighs nothing, and stays selectable.
 */
function Wordmark({ compact }: { compact: boolean }) {
  return (
    <a
      href="#top"
      aria-label="Taizan Capital — home"
      className="group inline-flex items-center gap-4 lg:gap-6"
    >
      <picture>
        <source
          srcSet="/media/brand/taizan-mark.webp 1x, /media/brand/taizan-mark@2x.webp 2x"
          type="image/webp"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/brand/taizan-mark.webp"
          alt=""
          width={605}
          height={478}
          decoding="async"
          fetchPriority="high"
          className={`w-auto transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            compact ? "h-11 lg:h-14" : "h-14 lg:h-16 xl:h-20"
          }`}
        />
      </picture>
      <span className="inline-flex flex-col leading-none">
      <span
        className={`font-serif text-paper transition-[font-size,letter-spacing] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          compact
            ? "text-[1.4rem] tracking-[0.2em] lg:text-[1.9rem]"
            : "text-[1.65rem] tracking-[0.22em] lg:text-[2.1rem] xl:text-[2.6rem]"
        }`}
      >
        TAIZAN
      </span>
      <span
        className={`mt-2 text-gold transition-[font-size,opacity] duration-700 ${
          compact
            ? "text-[0.48rem] tracking-[0.36em] lg:text-[0.58rem]"
            : "text-[0.52rem] tracking-[0.4em] lg:text-[0.6rem] xl:text-[0.68rem]"
        }`}
      >
        泰山資本 · CAPITAL
      </span>
      </span>
    </a>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        scrolled
          ? "glass py-4 lg:py-5"
          : "bg-transparent pb-6 pt-6 lg:pb-8 lg:pt-11"
      }`}
    >
      {/* Keeps the mark legible where the hero footage runs bright */}
      {!scrolled ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-ink/70 to-transparent"
        />
      ) : null}

      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-[110rem] items-center justify-between px-6 lg:px-14"
      >
        <Wordmark compact={scrolled} />

        {/* Six links plus the contact button is the most this bar can carry.
            At exactly 1024px the set clears the wordmark by ~40px; the gap
            and the button's padding both open back up at xl, where there is
            room. Adding a seventh link would require dropping to the mobile
            menu at a wider breakpoint. */}
        <ul className="hidden items-center gap-5 lg:flex xl:gap-10">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="link-underline text-[0.7rem] font-medium uppercase tracking-[0.24em] text-paper-dim transition-colors duration-300 hover:text-paper"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#contact"
              className="border border-gold/50 px-5 py-3 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink xl:px-7"
            >
              Contact
            </a>
          </li>
        </ul>

        <button
          type="button"
          className="text-paper lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 top-0 -z-10 flex flex-col justify-center bg-ink/[0.97] px-8 backdrop-blur-xl transition-opacity duration-500 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="space-y-7">
          {LINKS.map((l, i) => (
            <li
              key={l.href}
              style={{ transitionDelay: `${i * 60}ms` }}
              className={`transition-all duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-serif text-4xl text-paper"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li
            className={`pt-4 transition-all delay-300 duration-500 ${
              open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="inline-block border border-gold/50 px-8 py-3 text-[0.72rem] uppercase tracking-[0.24em] text-gold"
            >
              Contact
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
