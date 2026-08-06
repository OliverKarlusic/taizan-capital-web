"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "@/components/animations/SplitText";

gsap.registerPlugin(ScrollTrigger);

const CHAPTERS = [
  {
    kanji: "山",
    label: "The Summit — Foundations",
    text: "Building wealth begins with strong foundations.",
    detail:
      "Like the mountain, a portfolio must be engineered to stand through every season.",
  },
  {
    kanji: "雲",
    label: "Above the Clouds — Allocation",
    text: "Capital allocation determines long-term outcomes.",
    detail:
      "Weather moves below the summit. Position yourself above it, and the storms become scenery.",
  },
  {
    kanji: "静",
    label: "The Stillness — Discipline",
    text: "Discipline and patience protect wealth.",
    detail:
      "In stillness there is judgement. We act deliberately, or not at all.",
  },
];

/**
 * Three full-height cinematic chapters floating over the 3D environment.
 * Each chapter's copy eases in as the camera travels deeper into the scene.
 */
export default function Journey() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-chapter]").forEach((panel) => {
        const inner = panel.querySelector("[data-chapter-inner]");
        if (!inner) return;
        gsap.fromTo(
          inner,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              start: "top 75%",
              end: "top 30%",
              scrub: 0.6,
            },
          },
        );
        gsap.to(inner, {
          opacity: 0,
          y: -50,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            start: "bottom 62%",
            end: "bottom 28%",
            scrub: 0.6,
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} id="journey" aria-label="The Taizan journey">
      {CHAPTERS.map((c, i) => (
        <section
          key={i}
          data-chapter=""
          className="relative flex min-h-screen items-center justify-center px-6"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_88%_62%_at_50%_50%,rgba(10,10,10,0.74),rgba(10,10,10,0.34)_58%,transparent_88%)]"
          />
          <div
            data-chapter-inner=""
            className="relative z-10 mx-auto max-w-4xl text-center"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none font-serif text-[14rem] leading-none text-paper/[0.03] sm:text-[19rem]"
            >
              {c.kanji}
            </span>
            <p className="overline-label mb-7">
              {String(i + 1).padStart(2, "0")} — {c.label}
            </p>
            <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.12] text-paper">
              <SplitText text={c.text} stagger={0.014} />
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-sm font-light leading-relaxed text-paper-dim sm:text-base">
              {c.detail}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
