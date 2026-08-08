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
            compact ? "h-11 lg:h-14" : "h-14 xl:h-20"
          }`}
        />
      </picture>
      <span className="inline-flex flex-col leading-none">
      <span
        className={`font-serif text-paper transition-[font-size,letter-spacing] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          compact
            ? "text-[1.4rem] tracking-[0.2em] lg:text-[1.9rem]"
            : "text-[1.65rem] tracking-[0.22em] lg:text-[1.9rem] xl:text-[2.6rem]"
        }`}
      >
        TAIZAN
      </span>
      <span
        className={`mt-2 text-gold transition-[font-size,opacity] duration-700 ${
          compact
            ? "text-[0.48rem] tracking-[0.36em] lg:text-[0.58rem]"
            : "text-[0.52rem] tracking-[0.4em] lg:text-[0.56rem] lg:tracking-[0.32em] xl:text-[0.68rem] xl:tracking-[0.4em]"
        }`}
      >
        泰山資本 · CAPITAL
      </span>
      </span>
    </a>
  );
}

/**
 * `solid` pins the bar to its glass state permanently. The transparent
 * state exists so the bar can sit over the cinematic hero on the home
 * page; every other route opens on editorial content, and a transparent
 * bar there just lets paragraphs scroll through the navigation.
 */
export default function Navbar({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(solid);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (solid) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${
        solid
          ? "border-b border-paper/10 bg-ink py-4 lg:py-5"
          : scrolled
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

        {/* Six links plus the disclosures button need 673px, which does not
            clear the wordmark until ~1080px — so the bar switches to the
            overlay menu below that rather than at Tailwind's lg (1024px).
            The affected band is narrow, and iPad landscape lands in it and
            gets the overlay, which is the better presentation there anyway.
            Gap and button padding open back up at xl. */}
        <ul className="hidden items-center gap-4 min-[1080px]:flex xl:gap-10">
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
              href="/disclosures"
              className="border border-gold/50 px-4 py-3 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink xl:px-7"
            >
              Disclosures
            </a>
          </li>
        </ul>

        <button
          type="button"
          className="text-paper min-[1080px]:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 top-0 -z-10 flex flex-col justify-center bg-ink/[0.97] px-8 backdrop-blur-xl transition-opacity duration-500 min-[1080px]:hidden ${
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
              href="/disclosures"
              onClick={() => setOpen(false)}
              className="inline-block border border-gold/50 px-8 py-3 text-[0.72rem] uppercase tracking-[0.24em] text-gold"
            >
              Disclosures
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
