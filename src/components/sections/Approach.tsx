"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/animations/Reveal";
import { AllocationChart, GrowthChart } from "@/components/charts/lazy";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Fundamental Research",
    body: "Primary-source research on a deliberately narrow universe. Fewer positions, understood completely.",
  },
  {
    title: "Portfolio Construction",
    body: "Allocations are engineered from objectives and constraints — never assembled from conviction alone.",
  },
  {
    title: "Risk Management",
    body: "Risk is budgeted before return is pursued. Every exposure carries a pre-committed exit discipline.",
  },
  {
    title: "Deliberate Execution",
    body: "Positions are built patiently, at prices decided in advance. Urgency is the enemy of price.",
  },
  {
    title: "Compounding & Review",
    body: "Time does the heavy lifting. Each cycle ends in review — kaizen applied to our own process.",
  },
];

export default function Approach() {
  const lineRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const line = lineRef.current;
    const list = listRef.current;
    if (!line || !list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      line.style.transform = "scaleY(1)";
      return;
    }
    const tween = gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: list,
          start: "top 70%",
          end: "bottom 55%",
          scrub: 0.5,
        },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      id="approach"
      aria-labelledby="approach-title"
      className="relative z-10 bg-ink-soft py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="overline-label mb-6">03 — Investment Approach</p>
            </Reveal>
            <Reveal delay={0.1}>
              <h2
                id="approach-title"
                className="font-serif text-[clamp(2rem,4vw,3.2rem)] font-medium leading-[1.14] text-paper"
              >
                A process measured in
                <span className="italic text-gold-bright"> decades</span>, not
                quarters.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-7 max-w-md text-sm font-light leading-[1.9] text-paper-dim">
                Five disciplines, applied in sequence and without exception.
                The order is the strategy: risk is priced before return is
                pursued, and patience is enforced by process rather than
                temperament.
              </p>
            </Reveal>

            <div className="relative mt-16 pl-8">
              <div
                aria-hidden="true"
                className="absolute bottom-2 left-[3px] top-2 w-px bg-paper/10"
              />
              <div
                ref={lineRef}
                aria-hidden="true"
                className="absolute bottom-2 left-[3px] top-2 w-px origin-top bg-gradient-to-b from-gold to-gold/20"
                style={{ transform: "scaleY(0)" }}
              />
              <ol ref={listRef} className="space-y-12">
                {STEPS.map((s, i) => (
                  <Reveal key={s.title} as="li" delay={i * 0.08}>
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-8 top-1.5 block h-[7px] w-[7px] -translate-x-1/2 rotate-45 border border-gold bg-ink"
                        style={{ left: "-29px" }}
                      />
                      <p className="text-[0.65rem] uppercase tracking-[0.26em] text-stone-dim tabular">
                        Step {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-2 font-serif text-xl text-paper">
                        {s.title}
                      </h3>
                      <p className="mt-2 max-w-sm text-sm font-light leading-[1.8] text-stone">
                        {s.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>

          <div className="space-y-10 lg:col-span-7">
            <Reveal delay={0.15}>
              <AllocationChart />
            </Reveal>
            <Reveal delay={0.25}>
              <GrowthChart />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
