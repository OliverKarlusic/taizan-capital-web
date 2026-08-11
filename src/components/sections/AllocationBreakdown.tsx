import {
  AS_AT,
  BY_MARKET,
  BY_STRUCTURE,
  HOLDINGS,
  REPORTED_SECTORS,
  TOTAL_WEIGHT,
} from "@/data/growthMaximisationAllocation";

/**
 * Growth Maximisation — allocation as reported.
 *
 * Drawn as rules, not pies. A pie chart of five slices tells a reader less
 * than five numbers in a column does, and the colour wheel it needs is the
 * exact retail-platform vocabulary this site avoids. Weight is expressed as
 * the length of a hairline against the measure of the page — the same
 * device an institutional factsheet uses, and it costs no dependency.
 *
 * Only ink, stone and gold. Gold marks direct holdings, stone marks index
 * funds; that single distinction is the most informative thing about this
 * portfolio, so it is the only thing colour is spent on.
 */

function Bar({
  label,
  sub,
  weight,
  accent = false,
}: {
  label: string;
  sub?: string;
  weight: number;
  accent?: boolean;
}) {
  return (
    <div className="border-t border-paper/10 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-[0.95rem] font-light text-paper">
          {label}
          {sub ? (
            <span className="ml-3 text-[0.72rem] uppercase tracking-[0.16em] text-stone-dim">
              {sub}
            </span>
          ) : null}
        </p>
        <p className="tabular text-[0.95rem] text-paper">
          {weight.toFixed(2)}%
        </p>
      </div>
      {/* The rule is the chart. Width is the weight, nothing is rounded up
          to look tidier, and the track behind it makes the remainder
          legible without a second colour. */}
      <div
        className="mt-3 h-px w-full bg-paper/10"
        role="img"
        aria-label={`${weight.toFixed(2)} per cent of the portfolio`}
      >
        <div
          className={`h-px ${accent ? "bg-gold" : "bg-stone"}`}
          style={{ width: `${weight}%` }}
        />
      </div>
    </div>
  );
}

export default function AllocationBreakdown() {
  return (
    <section
      aria-labelledby="allocation-title"
      className="border-t border-paper/10 bg-ink-soft"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2
            id="allocation-title"
            className="text-[0.65rem] uppercase tracking-[0.28em] text-gold"
          >
            Allocation
          </h2>
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-stone-dim">
            As at {AS_AT}
          </p>
        </div>

        <p className="mt-8 max-w-[68ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
          The portfolio holds five positions. Three are index funds and two
          are companies held directly, which is the fact that explains most
          of how this strategy behaves.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-14 lg:grid-cols-12">
          {/* ── Holdings ── */}
          <div className="lg:col-span-7">
            <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
              Holdings
            </h3>
            <div className="mt-6">
              {HOLDINGS.map((h) => (
                <Bar
                  key={h.code}
                  label={h.code}
                  sub={h.name}
                  weight={h.weight}
                  accent={h.kind === "direct"}
                />
              ))}
              <div className="flex items-baseline justify-between border-t border-paper/20 pt-5">
                <p className="text-[0.62rem] uppercase tracking-[0.2em] text-stone">
                  Total
                </p>
                <p className="tabular text-[0.95rem] text-paper">
                  {TOTAL_WEIGHT.toFixed(2)}%
                </p>
              </div>
              <p className="mt-4 text-[0.65rem] leading-relaxed text-stone-dim">
                Weights are shown as reported and total{" "}
                {TOTAL_WEIGHT.toFixed(2)}% through rounding in the source.
                They have not been adjusted to reach a round number.
              </p>
            </div>
          </div>

          {/* ── The two derived views ── */}
          <div className="lg:col-span-5">
            <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
              By structure
            </h3>
            <div className="mt-6">
              {BY_STRUCTURE.map((r) => (
                <Bar
                  key={r.label}
                  label={r.label}
                  weight={r.weight}
                  accent={r.label === "Direct holdings"}
                />
              ))}
            </div>

            <h3 className="mt-14 text-[0.62rem] uppercase tracking-[0.22em] text-stone">
              By market
            </h3>
            <div className="mt-6">
              {BY_MARKET.map((r) => (
                <Bar key={r.label} label={r.label} weight={r.weight} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Sector, and why the sector view is nearly empty ── */}
        <div className="mt-16 border-t border-paper/10 pt-12">
          <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
            By sector, as classified
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-x-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              {REPORTED_SECTORS.map((r) => (
                <Bar key={r.label} label={r.label} weight={r.weight} />
              ))}
            </div>
            <div className="lg:col-span-5">
              <p className="mt-6 max-w-[52ch] text-[0.82rem] font-light leading-[1.9] text-stone lg:mt-0">
                Most of this portfolio cannot be assigned a sector. A fund is
                not a company, so the index holdings sit unclassified, and
                the two percentages that do appear describe only the two
                directly held businesses.
              </p>
              <p className="mt-5 max-w-[52ch] text-[0.82rem] font-light leading-[1.9] text-stone">
                Resolving the true sector exposure would mean looking through
                each fund to its constituents and their weights. That work
                has not been done here, and the classification is published
                as reported rather than estimated. The honest reading is that
                sector exposure in this portfolio is largely inherited from
                three indices rather than chosen.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-14 max-w-[78ch] text-[0.65rem] leading-[1.9] tracking-wide text-stone-dim">
          Holdings are shown as at {AS_AT} and will have changed since. A
          holding is a statement of what the portfolio owned on that date,
          not a recommendation to buy or sell any security, and nothing here
          takes account of your objectives, financial situation or needs.
          Taizan Capital publishes no performance figures for this or any
          strategy.
        </p>
      </div>
    </section>
  );
}
