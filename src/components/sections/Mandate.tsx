import Reveal from "@/components/animations/Reveal";

/**
 * What Taizan Capital actually is.
 *
 * This section exists because the film does not answer it. A visitor
 * arriving from the mountain knows the firm has taste and a point of view,
 * and has no idea what it invests in or how. Every subsequent section —
 * philosophy, portfolios, reporting — assumes an answer the site never
 * gave.
 *
 * Deliberately the plainest writing on the site. It sits immediately after
 * the film, at the moment the visitor stops watching and starts assessing,
 * and it changes register on purpose: short declarative sentences, no
 * metaphor, no mountain. The cinematic language has done its work by here;
 * continuing it would read as evasion.
 *
 * Nothing here is a claim about outcomes. It describes what the firm does,
 * not what it achieves.
 */

const PROCESS = [
  {
    step: "Study",
    body: "We read businesses from the bottom up — financial statements, unit economics, competitive position, and the industry conditions they operate within.",
  },
  {
    step: "Value",
    body: "From that work we form a view of what a business is worth at a point in time, and how confident we are in that view.",
  },
  {
    step: "Compare",
    body: "We set our assessment against the price the market is currently assigning. The gap between the two, and its durability, is the opportunity.",
  },
  {
    step: "Hold",
    body: "We invest where quality, value and price align, then allow time to do the work. Turnover is a cost, not a strategy.",
  },
];

export default function Mandate() {
  return (
    <section
      id="mandate"
      aria-labelledby="mandate-title"
      className="relative z-10 scroll-mt-28 bg-ink pb-24 pt-24 sm:pb-32 sm:pt-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            {/* Unnumbered on purpose. The film already owns 01-03 for its
                chapters and the editorial sections own 02-06; adding another
                01 here would make a third numbering system. */}
            <p className="overline-label mb-7">The Firm</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2
              id="mandate-title"
              className="font-serif text-[clamp(1.9rem,4vw,3.1rem)] font-medium leading-[1.16] text-paper"
            >
              Taizan Capital is a long-only investment manager.
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-2xl text-[0.95rem] font-light leading-[1.95] text-paper-dim">
              We invest in listed equities across the{" "}
              <span className="text-paper">ASX</span>,{" "}
              <span className="text-paper">NYSE</span> and{" "}
              <span className="text-paper">Nasdaq</span>. We buy shares in
              businesses we have studied, at prices we judge to be below what
              those businesses are worth, and we intend to own them for a long
              time.
            </p>
          </Reveal>
          <Reveal delay={0.28}>
            <p className="mx-auto mt-6 max-w-2xl text-[0.95rem] font-light leading-[1.95] text-stone">
              We do not short sell, trade derivatives, or take positions on
              short-term price movement. There is one way we make money for
              clients: owning good businesses bought at sensible prices.
            </p>
          </Reveal>
        </div>

        {/* The process, stated as four steps rather than four adjectives. */}
        <Reveal delay={0.15}>
          <ol className="mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p, i) => (
              <li key={p.step} className="border-t border-paper/12 pt-6">
                <p className="tabular text-[0.6rem] uppercase tracking-[0.28em] text-gold">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-serif text-xl text-paper">{p.step}</h3>
                <p className="mt-3 text-[0.82rem] font-light leading-[1.8] text-stone">
                  {p.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <p className="mx-auto mt-16 max-w-3xl text-center text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
          Taizan Capital does not currently publish performance data. Verified
          figures will be reported once a track record exists, alongside the
          disclosures that must accompany them.
        </p>
      </div>
    </section>
  );
}
