"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "@/components/animations/SplitText";
import { SCENE_BY_ID, hasFootage, type SceneId } from "@/lib/media";

gsap.registerPlugin(ScrollTrigger);

/**
 * The Mountain chapter is deliberately absent. Hero and Part 1 are one
 * environment, so that statement is played on the CinematicParallaxHero
 * stage over the live Fuji footage. Duplicating it here would show it twice,
 * the second time over an empty scene.
 */
const CHAPTERS: {
  scene: SceneId;
  kanji: string;
  label: string;
  text: string;
  detail: string;
}[] = [
  {
    scene: "forest",
    kanji: "森",
    label: "The Forest — Patience",
    text: "Discipline and patience protect wealth.",
    detail:
      "A cedar forest is planted in rows by people who will never sit in its shade. We invest the same way.",
  },
  {
    scene: "river",
    kanji: "川",
    label: "The River — Compounding",
    text: "Compounding rewards those who never interrupt it.",
    detail:
      "Water does not hurry, yet nothing withstands it. Continuous, patient force is how stone is carved.",
  },
];

/**
 * Three full-height cinematic chapters. Each declares its backing scene via
 * data-scene, and the film stage cross-dissolves the real footage to match
 * as the chapter enters the viewport.
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
      {/* Strict rule: a chapter never renders without its footage. A title
          over an empty environment reads as a broken page, and it puts the
          wrong environment behind the wrong words. If the asset is not
          connected, the chapter simply does not exist yet. */}
      {CHAPTERS.filter((c) => hasFootage(SCENE_BY_ID[c.scene])).map((c, i) => (
        <section
          key={i}
          data-chapter=""
          data-scene={c.scene}
          className="relative flex min-h-[110vh] items-center justify-center px-6"
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
