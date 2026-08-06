"use client";

import Reveal from "@/components/animations/Reveal";
import SplitText from "@/components/animations/SplitText";

const PRINCIPLES = [
  {
    kanji: "改善",
    romaji: "Kaizen",
    title: "Continuous Improvement",
    body: "Every process, every model, every decision is examined and refined without end. Small, compounding improvements in judgement produce the same curve as compounding capital — quietly, then unmistakably.",
  },
  {
    kanji: "間",
    romaji: "Ma",
    title: "Patience & Negative Space",
    body: "Ma is the interval — the deliberate pause that gives form its meaning. We hold cash without apology, decline crowded trades, and let opportunity come to the price we have already decided is right.",
  },
  {
    kanji: "職人",
    romaji: "Shokunin",
    title: "Mastery & Craft",
    body: "The shokunin devotes a lifetime to one discipline. Our analysts cover fewer positions, deeper. Ownership of a security is treated as ownership of a business — studied, visited, understood.",
  },
];

export default function Philosophy() {
  return (
    <section
      id="philosophy"
      aria-labelledby="philosophy-title"
      className="relative z-10 bg-ink py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <Reveal>
            <p className="overline-label mb-6">02 — Investment Philosophy</p>
          </Reveal>
          <h2
            id="philosophy-title"
            className="font-serif text-[clamp(2rem,4.5vw,3.6rem)] font-medium leading-[1.12] text-paper"
          >
            <SplitText text="Wealth is not built through speculation." stagger={0.012} />
            <br />
            <SplitText
              text="It is built through patience, discipline and intelligent decisions over time."
              stagger={0.008}
              className="text-stone"
            />
          </h2>
        </div>

        <div className="mt-24 space-y-0">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.romaji} delay={i * 0.12}>
              <article className="group grid grid-cols-1 gap-8 border-t border-paper/10 py-14 transition-colors duration-700 last:border-b hover:bg-paper/[0.02] md:grid-cols-12 md:gap-6">
                <div className="md:col-span-1">
                  <span className="text-xs tracking-[0.2em] text-stone-dim tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="md:col-span-3">
                  <span className="font-serif text-6xl text-gold/85 transition-colors duration-700 group-hover:text-gold-bright sm:text-7xl">
                    {p.kanji}
                  </span>
                </div>
                <div className="md:col-span-3">
                  <h3 className="font-serif text-2xl italic text-paper">
                    {p.romaji}
                  </h3>
                  <p className="mt-2 text-[0.68rem] uppercase tracking-[0.26em] text-gold">
                    {p.title}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <p className="max-w-lg text-sm font-light leading-[1.9] text-paper-dim">
                    {p.body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
