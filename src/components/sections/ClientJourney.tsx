"use client";

import { useEffect, useRef, useState } from "react";
import MagneticButton from "@/components/ui/MagneticButton";

/**
 * What it is like to become a client.
 *
 * A prospective investor's real question after reading the strategies is
 * "what actually happens if I get in touch" — and the site previously
 * answered it with a button. This is the answer: five stages, in order,
 * with what happens at each.
 *
 * Activation uses IntersectionObserver rather than GSAP. The cinematic
 * timeline owns ScrollTrigger, and a second scroll-driven system competing
 * with it is how the mist bridge broke earlier in this build. An observer
 * is independent, cheaper, and sufficient for what this needs to do.
 *
 * On timing: the stage labels are ranges, not commitments. Nothing here
 * states a duration Taizan has agreed to, because none has been agreed.
 */

interface Stage {
  index: string;
  title: string;
  lead: string;
  timing: string;
  body: string;
  detail: string[];
}

const STAGES: Stage[] = [
  {
    index: "01",
    title: "Free Consultation",
    lead: "An introductory conversation.",
    timing: "First contact",
    body: "A complimentary one-hour conversation. Its purpose is to understand you — what the capital is for, when you may need it, and what you would want to happen in a difficult year. Nothing is recommended and nothing is sold in this meeting.",
    detail: [
      "Investment objectives and long-term goals",
      "Financial circumstances and existing investments",
      "Investment horizon and liquidity requirements",
      "Tolerance for volatility and loss",
    ],
  },
  {
    index: "02",
    title: "Objectives & Assessment",
    lead: "Understanding your requirements.",
    timing: "Following the consultation",
    body: "We take what was discussed and work out whether Taizan Capital is an appropriate manager for it. Capital is not accepted and invested on the strength of a conversation — the assessment comes first, and it can conclude that we are not the right fit.",
    detail: [
      "Income requirements and drawdown expectations",
      "Existing portfolio and concentration already held",
      "Capital requirements and contribution pattern",
      "Whether a Taizan strategy suits the objective",
    ],
  },
  {
    index: "03",
    title: "Portfolio Construction",
    lead: "Developing the appropriate strategy.",
    timing: "Once objectives are established",
    body: "The strategy is built around your objectives and risk parameters rather than issued from a template. Taizan Capital is a long-only equity manager investing across the ASX, NYSE and Nasdaq, and the construction reflects both the businesses we judge worth owning and the constraints you have set.",
    detail: [
      "Business quality, financial metrics and valuation",
      "Macroeconomic and industry conditions",
      "Position sizing, diversification and concentration limits",
      "Investment horizon matched to your requirements",
    ],
  },
  {
    index: "04",
    title: "Onboarding & Due Diligence",
    lead: "Documentation and account establishment.",
    timing: "Once the strategy is agreed",
    body: "The formal steps that make the relationship real. These exist to protect both sides — they establish who you are, what has been agreed, and on what terms capital is managed. We will tell you what is required before it is required.",
    detail: [
      "Identity verification and client due diligence",
      "Account establishment and required documentation",
      "The investment mandate, agreed in writing",
      "Funding instructions and settlement arrangements",
    ],
  },
  {
    index: "05",
    title: "Capital Deployment",
    lead: "Implementation and ongoing management.",
    timing: "Ongoing",
    body: "Capital is deployed according to the agreed strategy — deliberately, and at prices decided in advance rather than on the day it arrives. The relationship does not end there. A portfolio is held, monitored and revisited for as long as it is managed.",
    detail: [
      "Company fundamentals and investment thesis reviewed",
      "Valuation reassessed as conditions change",
      "Portfolio risk, position sizing and concentration monitored",
      "Reporting and continuing conversation",
    ],
  },
];

export default function ClientJourney() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const nodes = refs.current.filter(Boolean) as HTMLLIElement[];
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // The stage nearest the middle of the viewport is the active one.
        let best = -1;
        let bestRatio = 0;
        for (const e of entries) {
          if (e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            best = nodes.indexOf(e.target as HTMLLIElement);
          }
        }
        if (best >= 0) setActive(best);
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: [0.1, 0.5, 1] },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="start"
      aria-labelledby="start-title"
      className="relative z-10 scroll-mt-28 bg-ink py-24 sm:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* ── The opening: the consultation is the unmistakable first step ── */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="overline-label mb-7">Becoming a client</p>
          <h2
            id="start-title"
            className="font-serif text-[clamp(1.9rem,4vw,3.1rem)] font-medium leading-[1.16] text-paper"
          >
            Start the conversation.
          </h2>
          <p className="mx-auto mt-8 max-w-[58ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
            Begin with a complimentary one-hour consultation. It exists to
            understand your objectives, horizon and tolerance for risk — and to
            establish whether Taizan Capital is an appropriate manager for
            them. Some conversations conclude that it is not.
          </p>
          <div className="mt-11 flex justify-center">
            <MagneticButton href="#contact">Book a Consultation</MagneticButton>
          </div>
        </div>

        {/* ── The five stages ── */}
        <ol className="relative mx-auto mt-24 max-w-5xl sm:mt-32">
          {/* Connecting rail. Hidden on mobile, where the numbers already
              sit in a single column and a line adds nothing. */}
          <span
            aria-hidden="true"
            className="absolute bottom-8 left-[7px] top-8 hidden w-px bg-paper/10 sm:block"
          />

          {STAGES.map((s, i) => {
            const isActive = i === active;
            return (
              <li
                key={s.index}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="relative pb-16 last:pb-0 sm:pl-14"
              >
                {/* Node on the rail */}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-2 hidden h-[15px] w-[15px] rotate-45 border transition-all duration-700 sm:block ${
                    isActive
                      ? "border-gold bg-gold/25"
                      : "border-paper/25 bg-ink"
                  }`}
                />

                <div
                  className="transition-opacity duration-700"
                  style={{ opacity: isActive ? 1 : 0.42 }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                    <span
                      className={`tabular font-serif text-3xl transition-colors duration-700 sm:text-4xl ${
                        isActive ? "text-gold" : "text-stone-dim"
                      }`}
                    >
                      {s.index}
                    </span>
                    <h3 className="font-serif text-[clamp(1.35rem,2.6vw,1.9rem)] leading-tight text-paper">
                      {s.title}
                    </h3>
                    <span className="ml-auto text-[0.58rem] uppercase tracking-[0.22em] text-stone-dim">
                      {s.timing}
                    </span>
                  </div>

                  <p className="mt-3 font-serif text-lg italic text-paper-dim">
                    {s.lead}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-2">
                    <p className="max-w-[58ch] text-[0.88rem] font-light leading-[1.9] text-paper-dim">
                      {s.body}
                    </p>
                    <ul className="space-y-2.5">
                      {s.detail.map((d) => (
                        <li
                          key={d}
                          className="flex gap-3 text-[0.82rem] font-light leading-relaxed text-stone"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[0.55em] h-px w-3 shrink-0 bg-gold/50"
                          />
                          <span className="min-w-0">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* ── Close: back to the one action ── */}
        <div className="mx-auto mt-24 max-w-3xl border-t border-paper/10 pt-14 text-center">
          <p className="mx-auto max-w-[54ch] font-serif text-xl italic leading-relaxed text-stone sm:text-2xl">
            Preserve capital first. Compound it second.
          </p>
          <div className="mt-10 flex justify-center">
            <MagneticButton href="#contact">Book a Consultation</MagneticButton>
          </div>
          <p className="mx-auto mt-12 max-w-[76ch] text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
            Stage timings vary with each client&apos;s circumstances,
            structure, documentation and funding arrangements, and are
            indicative rather than committed. Taizan Capital&apos;s strategies
            are not suitable for every investor. Nothing here constitutes
            financial product advice or an offer, and no outcome is promised.
          </p>
        </div>
      </div>
    </section>
  );
}
