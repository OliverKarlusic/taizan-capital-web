"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#philosophy", label: "Philosophy" },
  { href: "#approach", label: "Approach" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#insights", label: "Insights" },
  { href: "#about", label: "About" },
];

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
        scrolled ? "glass py-4" : "bg-transparent py-7"
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 lg:px-10"
      >
        <a href="#top" className="flex items-baseline gap-3">
          <span className="font-serif text-xl tracking-[0.18em] text-paper">
            TAIZAN
          </span>
          <span className="text-[0.62rem] tracking-[0.3em] text-gold">
            泰山資本
          </span>
        </a>

        <ul className="hidden items-center gap-10 lg:flex">
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
              className="border border-gold/50 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-gold transition-all duration-500 hover:bg-gold hover:text-ink"
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
          {open ? <X size={22} /> : <Menu size={22} />}
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
