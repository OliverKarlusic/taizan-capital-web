"use client";

import Reveal from "@/components/animations/Reveal";
import SplitText from "@/components/animations/SplitText";

const LEADERSHIP = [
  {
    name: "Kenji Takahara",
    role: "Managing Partner & Chief Investment Officer",
    line: "Two decades allocating institutional capital across Asia and the Americas.",
  },
  {
    name: "Elena Marchetti",
    role: "Partner, Head of Risk",
    line: "Former sovereign-fund risk architect. Believes risk is a budget, not a feeling.",
  },
  {
    name: "Daisuke Mori",
    role: "Partner, Head of Research",
    line: "Leads a deliberately small research bench covering fewer names, deeper.",
  },
];

const FACTS = [
  { value: "2009", label: "Founded, Tokyo" },
  { value: "3", label: "Offices — Tokyo · London · Singapore" },
  { value: "40+", label: "Institutional & family mandates" },
  { value: "17yr", label: "Average client relationship" },
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
                principles absent from modern markets. We manage capital for
                institutions and families who measure success in generations,
                and who expect their manager to do the same.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-6 text-sm font-light leading-[2] text-stone">
                Our mission is unchanged since the first mandate: preserve
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
                  <div className="group border-b border-paper/10 py-9 first:mt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h4 className="font-serif text-2xl text-paper transition-colors duration-500 group-hover:text-gold-bright">
                        {person.name}
                      </h4>
                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">
                        {person.role}
                      </p>
                    </div>
                    <p className="mt-3 max-w-xl text-sm font-light leading-relaxed text-stone">
                      {person.line}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.35}>
              <p className="mt-10 text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
                Taizan Capital is a fictional firm created for this design
                concept. All names, figures and mandates are illustrative.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
