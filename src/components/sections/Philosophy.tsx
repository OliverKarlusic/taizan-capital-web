"use client";

import Reveal from "@/components/animations/Reveal";
import SplitText from "@/components/animations/SplitText";

/**
 * The investment philosophy, stated as method rather than temperament.
 *
 * This previously ran on three Japanese concepts — Kaizen, Ma, Shokunin —
 * which described how the firm behaves without ever saying what it does.
 * A prospective investor could read the whole section and still not know
 * whether Taizan values businesses, trades momentum, or follows an index.
 *
 * The hierarchy is now inverted: the investment principle is the heading
 * and the Japanese term is the quiet anchor beneath it. The aesthetic
 * supports the philosophy instead of standing in for it. Ma and Shokunin
 * are kept because they genuinely describe time and process; the first
 * three are new because value, fundamentals and price had no
 * representation at all.
 *
 * Nothing here promises an outcome. Every line describes how a decision is
 * made, not what it returns.
 */
const PRINCIPLES = [
  {
    kanji: "価値",
    romaji: "Kachi",
    title: "Intrinsic Value",
    body: "A business is worth the cash it can produce over its remaining life, discounted for time and for our uncertainty about it. That figure is estimated, never observed. We would rather be approximately right about a business we understand than precisely wrong about one we do not.",
  },
  {
    kanji: "財務",
    romaji: "Zaimu",
    title: "Financial Fundamentals",
    body: "We work from the financial statements: how earnings are actually generated, how much capital it takes to generate them, how reliably they convert to cash, and what the balance sheet would withstand. Quality is visible in the numbers long before it is visible in the price.",
  },
  {
    kanji: "価格",
    romaji: "Kakaku",
    title: "Price & Margin of Safety",
    body: "Value is what a business is worth. Price is what the market is asking for it today. We act only where the gap between them is wide enough to absorb the possibility that our estimate is wrong — and we accept that for long periods there will be nothing worth doing.",
  },
  {
    kanji: "間",
    romaji: "Ma",
    title: "Time & Patience",
    body: "Ma is the interval that gives form its meaning. Value accrues to a business over years, not quarters, and the return on owning it accrues on the same schedule. We hold cash without apology, decline crowded positions, and let opportunity come to a price we decided on in advance.",
  },
  {
    kanji: "職人",
    romaji: "Shokunin",
    title: "Process & Discipline",
    body: "The shokunin does the work the same way whether anyone is watching. We cover fewer businesses more deeply, apply the same standard in calm markets and disorderly ones, and treat short-term price movement as information about sentiment rather than about value.",
  },
];

export default function Philosophy() {
  return (
    <section
      id="philosophy"
      aria-labelledby="philosophy-title"
      className="relative z-10 bg-ink pb-28 pt-24 sm:pb-40 sm:pt-28"
    >
      {/* The current, received. Identical geometry, colour and width to the
          hairline drawn at the close of the film — the visitor's eye lands
          on the same line it last saw being drawn, and the film becomes the
          argument without a cut. */}
      <div
        aria-hidden="true"
        className="mx-auto mb-24 h-px w-[min(70vw,52rem)] sm:mb-28"
        style={{
          background:
            "linear-gradient(90deg, transparent, #c6a664 18%, #c6a664 82%, transparent)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <Reveal>
            <p className="overline-label mb-6">02 — Investment Philosophy</p>
          </Reveal>
          <h2
            id="philosophy-title"
            className="font-serif text-[clamp(2rem,4.5vw,3.6rem)] font-medium leading-[1.12] text-paper"
          >
            <SplitText text="Price is what the market asks today." stagger={0.012} />
            <br />
            <SplitText
              text="Value is what a business is actually worth."
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
                  <h3 className="font-serif text-2xl leading-tight text-paper">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[0.68rem] uppercase tracking-[0.26em] text-gold">
                    {p.romaji}
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
