import type { Metadata } from "next";
import {
  COVERAGE,
  SCORE_METHOD,
  coverageScore,
  type CoverageState,
} from "@/data/researchCoverage";

export const metadata: Metadata = {
  title: "Research Coverage — Taizan Capital",
  description:
    "What the Research Terminal can and cannot answer, by capability, with the blocker named for each gap.",
};

/**
 * The coverage audit.
 *
 * A terminal that shows what it has and stays quiet about what it lacks
 * leaves the reader to discover the gaps by hitting them. This page is
 * the inverse: it states, per capability, what can be answered and what
 * cannot — and names the blocker, because most gaps here are a data
 * licence rather than unfinished work, and those are different problems.
 */

const LABEL: Record<CoverageState, string> = {
  available: "Available",
  partial: "Partial",
  missing: "Missing",
  blocked: "Blocked",
  "not-applicable": "Not applicable",
};

const TONE: Record<CoverageState, string> = {
  available: "border-gold/50 text-gold",
  partial: "border-ice/40 text-ice",
  missing: "border-paper/20 text-stone",
  blocked: "border-paper/20 text-stone",
  "not-applicable": "border-paper/10 text-stone-dim",
};

export default function CoveragePage() {
  const score = coverageScore();

  return (
    <div className="mx-auto max-w-[110rem] px-6 py-10 lg:px-10">
      <h1 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-tight text-paper">
        Research Coverage
      </h1>
      <p className="mt-3 max-w-[80ch] text-[0.85rem] font-light leading-[1.85] text-paper-dim">
        What this terminal can answer about a security, what it can answer
        partly, and what it cannot answer at all. Each gap names its blocker.
        Most are the limits of a free data tier rather than unfinished work,
        and the distinction is stated rather than blurred.
      </p>

      {/* ── Score, with its formula beside it rather than beneath it ── */}
      <div className="mt-10 border-y border-paper/12 py-8">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
          <p className="tabular font-serif text-[clamp(2.2rem,5vw,3.4rem)] leading-none text-paper">
            {score.percent.toFixed(0)}
            <span className="ml-1 text-[0.4em] text-stone">%</span>
          </p>
          <div className="text-[0.72rem] leading-relaxed text-stone">
            <p>
              <span className="tabular text-paper">{score.points}</span> of{" "}
              <span className="tabular text-paper">{score.total}</span>{" "}
              capabilities
            </p>
            <p className="mt-1 text-stone-dim">{SCORE_METHOD}</p>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-[0.72rem]">
            {(
              [
                ["available", score.counts.available],
                ["partial", score.counts.partial],
                ["missing", score.counts.missing],
                ["blocked", score.counts.blocked],
              ] as const
            ).map(([k, n]) => (
              <div key={k}>
                <dt className="text-[0.58rem] uppercase tracking-[0.18em] text-stone-dim">
                  {LABEL[k]}
                </dt>
                <dd className="tabular mt-1 text-[0.95rem] text-paper">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── Capabilities ── */}
      <div className="mt-14 space-y-14">
        {COVERAGE.map((group) => (
          <section key={group.group}>
            <h2 className="text-[0.62rem] uppercase tracking-[0.26em] text-gold">
              {group.group}
            </h2>
            <ul className="mt-6">
              {group.capabilities.map((c) => (
                <li
                  key={c.name}
                  className="grid grid-cols-1 gap-x-10 gap-y-3 border-t border-paper/10 py-6 lg:grid-cols-12"
                >
                  <div className="lg:col-span-3">
                    <h3 className="font-serif text-lg leading-snug text-paper">
                      {c.name}
                    </h3>
                    <span
                      className={`mt-2 inline-block border px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.18em] ${TONE[c.state]}`}
                    >
                      {LABEL[c.state]}
                    </span>
                  </div>
                  <p className="max-w-[62ch] text-[0.82rem] font-light leading-[1.85] text-paper-dim lg:col-span-5">
                    {c.present}
                  </p>
                  <p className="max-w-[62ch] text-[0.78rem] font-light leading-[1.85] text-stone lg:col-span-4">
                    {c.gap || (
                      <span className="text-stone-dim">No known gap.</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 max-w-[86ch] text-[0.68rem] leading-[1.9] text-stone-dim">
        Every state above was verified against the live data source rather
        than assumed from its documentation. Where a capability is marked
        blocked, building it against the inputs currently available would
        produce output whose precision the data does not support — which is
        a worse outcome than the gap.
      </p>
    </div>
  );
}
