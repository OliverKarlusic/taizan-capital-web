"use client";

import Reveal from "@/components/animations/Reveal";
import SplitText from "@/components/animations/SplitText";

/**
 * Leadership.
 *
 * This previously listed three invented people with invented careers. They
 * were placeholder copy from the design phase, and fabricated personnel on
 * a real firm's site is not a stylistic problem — it is a claim about who
 * manages the money. Removed.
 *
 * NAME UNCONFIRMED: inferred from the account email, never stated. Verify
 * before this goes anywhere public.
 */
const LEADERSHIP = [
  {
    name: "Oliver Karlusic",
    role: "Managing Director",
    line: "Oliver Karlusic holds a Bachelor of Business, majoring in Finance and Economics, and works in corporate finance. His investment approach is grounded in long-term fundamental analysis, with a focus on understanding businesses through changing economic cycles. He currently manages a personal portfolio of over $60,000, invested on the same basis described here.",
    image: "/media/brand/profile-md.webp",
    image2x: "/media/brand/profile-md@2x.webp",
  },
];

const FACTS = [
  // Only facts that are true. Mandate counts and average client tenure were
  // invented, and a firm founded in 2026 cannot have a seventeen-year
  // client relationship — the claim contradicted its own founding date.
  { value: "2026", label: "Founded, Melbourne" },
  { value: "3000", label: "Melbourne, Victoria — Australia" },
];

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative z-10 bg-ink py-28 sm:py-40"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <p className="overline-label mb-6">06 — About Taizan Capital</p>
        </Reveal>

        <h2
          id="about-title"
          className="max-w-4xl font-serif text-[clamp(2rem,4.5vw,3.6rem)] font-medium leading-[1.14] text-paper"
        >
          <SplitText
            text="Named for the great mountain: unmoved by weather, shaped only by time."
            stagger={0.01}
          />
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal delay={0.15}>
              <p className="text-sm font-light leading-[2] text-paper-dim">
                Taizan Capital was founded on a single conviction: that the
                principles which built Japan&apos;s enduring institutions —
                patience, craftsmanship, restraint — are precisely the
                principles absent from modern markets. The firm is being
                built to manage capital for people who measure success in
                generations, and who expect their manager to do the same.
                That work is deliberately slow: the philosophy, the research
                framework and the risk discipline come first, and the
                licensing and structure that would allow Taizan to accept
                external capital come only once they are sound.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-6 text-sm font-light leading-[2] text-stone">
                The intention is fixed and predates any mandate: preserve
                capital first, compound it second, and never confuse the order.
              </p>
            </Reveal>

            <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10">
              {FACTS.map((f, i) => (
                <Reveal key={f.label} delay={0.1 + i * 0.06}>
                  <div>
                    <p className="tabular font-serif text-3xl text-gold-bright">
                      {f.value}
                    </p>
                    <p className="mt-2 text-[0.65rem] uppercase leading-relaxed tracking-[0.2em] text-stone">
                      {f.label}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.1}>
              <h3 className="text-[0.68rem] uppercase tracking-[0.28em] text-stone">
                Leadership
              </h3>
            </Reveal>
            <div>
              {LEADERSHIP.map((person, i) => (
                <Reveal key={person.name} delay={0.15 + i * 0.08}>
                  <figure className="group mt-6 flex flex-col gap-7 border-b border-paper/10 pb-10 sm:flex-row sm:items-end">
                    <div className="relative w-40 shrink-0 overflow-hidden border border-paper/12 sm:w-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={person.image}
                        srcSet={`${person.image} 1x, ${person.image2x} 2x`}
                        alt={`${person.name}, ${person.role}`}
                        width={620}
                        height={775}
                        loading="lazy"
                        decoding="async"
                        className="block h-auto w-full [filter:contrast(1.04)_saturate(0.88)]"
                      />
                      {/* Same bronze wash the film and the conviction plates
                          carry, so the portrait sits in the same production. */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                        style={{ backgroundColor: "rgba(198,166,100,0.14)" }}
                      />
                    </div>
                    <figcaption className="min-w-0">
                      <h4 className="font-serif text-2xl text-paper transition-colors duration-500 group-hover:text-gold-bright">
                        {person.name}
                      </h4>
                      <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                        {person.role}
                      </p>
                      <p className="mt-4 max-w-[46ch] text-[0.82rem] font-light leading-[1.85] text-stone">
                        {person.line}
                      </p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.35}>
              <p className="mt-10 text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
                Taizan Capital publishes no fund-level track record.
                  Portfolio mandates describe investment approach; realised
                  results, where they exist, are shown on the relevant
                  strategy page.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
