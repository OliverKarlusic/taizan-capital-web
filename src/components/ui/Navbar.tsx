"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#mandate", label: "The Firm" },
  { href: "#philosophy", label: "Philosophy" },
  { href: "#approach", label: "Approach" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "/performance", label: "Performance" },
  { href: "/research", label: "Research" },
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
function Wordmark({ compact, home }: { compact: boolean; home: boolean }) {
  return (
    <a
      href={home ? "#top" : "/"}
      aria-label="Taizan Capital — home"
      className="group inline-flex items-center gap-4 lg:gap-6"
    >
      <picture>
        <source
          srcSet="/media/brand/taizan-mark.webp 1x, /media/brand/taizan-mark@2x.webp 2x"
          type="image/webp"
        />
        {/* No eslint-disable here: no-img-element does not fire on an
            <img> inside a <picture>, and the redundant directive was the
            only lint warning left in the project. */}
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
  // Section links are fragments, which resolve only on the homepage. From
  // /performance or a strategy page they pointed at nothing at all — seven
  // dead links per route. Off the homepage they become root-relative.
  const home = usePathname() === "/";
  const link = (href: string) =>
    home || !href.startsWith("#") ? href : `/${href}`;

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

  /**
   * Close the menu and release the scroll lock in the same tick.
   *
   * ── WHY setOpen ALONE WAS NOT ENOUGH ────────────────────────────────
   * The overlay locks the page with overflow:hidden while it is open, and
   * releases it from an effect — which React runs after paint. The smooth
   * scroller's anchor handler, by contrast, runs synchronously as the
   * click bubbles to the document. So the order was: link clicked, close
   * queued, scroller asked to move, page still locked, nothing happens,
   * lock released a frame later with the destination forgotten.
   *
   * Every navigation link therefore looked dead on a phone: the menu
   * closed and the page stayed exactly where it was. Clearing the lock
   * here makes it gone before the scroller is asked to do anything.
   */
  const closeMenu = () => {
    document.documentElement.style.overflow = "";
    setOpen(false);
  };

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
        <Wordmark compact={scrolled} home={home} />

        {/* Seven links plus the disclosures button measure 868px at the
            tight gap. With the 241px wordmark and the container's 112px of
            padding they need ~1261px of viewport before anything separates
            them, so the row appears at xl (1280px) and the overlay menu
            covers everything below.

            This was min-[1080px] when the row held six links. Adding
            Research pushed the requirement out by roughly 180px, and both
            1080 and 1220 were measured putting the first link flush
            against the wordmark with zero pixels between. iPad landscape
            lands in the overlay band, which is the better presentation
            there anyway. */}
        {/* The generous gap waits for 1500px. It widens the row from 868px
            to 1036px, which needs ~1429px of viewport to still clear the
            wordmark — measured at 1400px it left 5px. Between 1280 and
            1500 the tighter gap keeps the bar breathing. */}
        <ul className="hidden items-center gap-4 xl:flex min-[1500px]:gap-10">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={link(l.href)}
                className="link-underline text-[0.7rem] font-medium uppercase tracking-[0.24em] text-paper-dim transition-colors duration-300 hover:text-paper"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/disclosures"
              className="inline-flex min-h-11 items-center border border-gold/50 px-4 py-3 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink min-[1500px]:px-7"
            >
              Disclosures
            </a>
          </li>
        </ul>

        {/* The icon is 24px; the hit area must not be. Padding takes the
            target to 44x44 and the equal negative margin keeps the button
            sitting exactly where it did, so this costs nothing visually.
            This is the only way into the navigation on a phone.

            The drop shadow matches the wordmark's hero-legible treatment.
            Over the opening frames of the film the icon is a thin white
            stroke on bright mist, and without it the three lines wash out
            against the footage — the control is present but the eye
            cannot find it. */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-paper drop-shadow-[0_1px_3px_rgba(10,10,10,0.75)] xl:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* ── Mobile overlay ──
          Scrolls, and clears the header.

          It was `justify-center` with no overflow, on a list that stands
          537px tall. That fits the 812px viewport a desktop emulator
          reports and not the ~540px a real phone leaves once the address
          bar and home indicator are taken out — so "The Firm" sat behind
          the fixed header, "Disclosures" fell off the bottom, and neither
          could be reached because the overlay did not scroll.

          Centring is done with `m-auto` on the list rather than
          `justify-center` on the container: a flex container that centres
          overflowing content puts the overflow above its own scroll
          origin, so the top of the list becomes unreachable even once
          scrolling is enabled. Auto margins collapse instead, which
          centres a short list and top-aligns a tall one. */}
      <div
        className={`fixed inset-0 top-0 -z-10 flex overflow-y-auto overscroll-contain bg-ink/[0.97] px-8 pb-12 pt-24 backdrop-blur-xl transition-opacity duration-500 xl:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="m-auto w-full space-y-7">
          {LINKS.map((l, i) => (
            <li
              key={l.href}
              style={{ transitionDelay: `${i * 60}ms` }}
              className={`transition-all duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <a
                href={link(l.href)}
                onClick={closeMenu}
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
              onClick={closeMenu}
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
