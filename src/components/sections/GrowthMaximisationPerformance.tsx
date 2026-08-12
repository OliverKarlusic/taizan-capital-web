import {
  BENCHMARK,
  CAVEATS,
  CHART_SRC,
  COMMENTARY,
  HEADLINE,
  HOLDINGS,
  INCEPTION,
} from "@/data/growthMaximisationPerformance";
import { TRACED, TRACED_TERMINAL } from "@/data/growthMaximisationSeries";

/**
 * Growth Maximisation — performance, redrawn in the site's own idiom.
 *
 * ── WHERE THE NUMBERS COME FROM ─────────────────────────────────────
 * This strategy has no ledger. No transactions, no valuations, no price
 * history — the supplied PNG is the entire record. So the series behind
 * this chart is a pixel-level trace of that PNG, produced by
 * scripts/trace-chart.mjs and calibrated against the render's own axis.
 * It is a measurement of the supplied artefact, reproducible by re-running
 * the script, and it is not hand-authored.
 *
 * That distinction is load-bearing and the page states it: this
 * reproduces the CHART faithfully; it does not independently measure the
 * PORTFOLIO. The original image stays published and is linked directly
 * beneath, so a reader can check the redraw against the source rather
 * than take it on trust.
 *
 * ── WHY REDRAW AT ALL ───────────────────────────────────────────────
 * The raster was a white rectangle on an ink-black page, at a fixed
 * 1627px, whose axis labels rendered at 3.6px on a phone. It needed a
 * light plate to sit on and a horizontal scroller to stay legible, and it
 * still read as a screenshot pasted into a report. As SVG it scales to
 * any width, carries the site's palette and type, and stays legible at
 * 375px — while showing exactly the same curve.
 *
 * ── WHY THERE ARE NO DATES ALONG THE BOTTOM ─────────────────────────
 * The supplied chart has no x-axis labels. Inventing them would mean
 * deciding where each quarter falls along a curve whose sampling
 * interval is unknown, which is exactly the kind of plausible-looking
 * fabrication the rest of this file exists to avoid. The axis is
 * therefore anchored at both ends and left unmarked between them.
 */

const W = 820;
const H = 380;
const PAD = { top: 24, right: 104, bottom: 40, left: 60 };
/* The traced series runs from about −6% to about +104%. */
const MIN = -15;
const MAX = 115;

const x = (t: number) => PAD.left + t * (W - PAD.left - PAD.right);
const y = (v: number) =>
  H - PAD.bottom - ((v - MIN) / (MAX - MIN)) * (H - PAD.top - PAD.bottom);

const path = (key: "portfolio" | "benchmark") =>
  TRACED.map(
    (p, i) =>
      `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)} ${y(p[key]).toFixed(1)}`,
  ).join(" ");

/** Approximate throughout — this is a traced reading, not a measurement. */
const pct = (n: number) => `~${n > 0 ? "+" : ""}${Math.round(n)}%`;

const BAND = [
  ...TRACED.map(
    (p, i) =>
      `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)} ${y(p.benchmark).toFixed(1)}`,
  ),
  ...TRACED.map((_, i) => {
    const p = TRACED[TRACED.length - 1 - i];
    return `L${x(p.t).toFixed(1)} ${y(p.portfolio).toFixed(1)}`;
  }),
  "Z",
].join(" ");

export default function GrowthMaximisationPerformance() {
  return (
    <section
      aria-labelledby="gm-performance-title"
      className="border-t border-paper/10"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2
            id="gm-performance-title"
            className="text-[0.65rem] uppercase tracking-[0.28em] text-gold"
          >
            Performance
          </h2>
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-stone-dim">
            Since inception {INCEPTION}
          </p>
        </div>

        {/* ── Headline, holdings, benchmark ── */}
        <div className="mt-10 grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="tabular font-serif text-[clamp(2.6rem,6vw,4rem)] leading-none text-gold">
              {HEADLINE}
            </p>
            <p className="mt-4 text-[0.72rem] uppercase tracking-[0.2em] text-stone">
              Since inception, against the {BENCHMARK}
            </p>
            <p className="mt-8 max-w-[54ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
              {COMMENTARY}
            </p>
          </div>

          <div className="lg:col-span-7">
            <dl className="grid grid-cols-1 gap-0 sm:grid-cols-2">
              <div className="border-t border-paper/12 py-5 sm:pr-8">
                <dt className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
                  Benchmark
                </dt>
                <dd className="mt-2 font-serif text-xl text-paper">
                  {BENCHMARK}
                </dd>
              </div>
              <div className="border-t border-paper/12 py-5 sm:pl-8">
                <dt className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
                  Inception
                </dt>
                <dd className="mt-2 font-serif text-xl text-paper">
                  {INCEPTION}
                </dd>
              </div>
            </dl>

            <h3 className="mt-8 text-[0.62rem] uppercase tracking-[0.22em] text-stone">
              Holdings
            </h3>
            <ul className="mt-4">
              {HOLDINGS.map((h) => (
                <li
                  key={h.ticker}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-t border-paper/10 py-4"
                >
                  <span className="tabular font-serif text-lg text-paper">
                    {h.ticker}
                  </span>
                  <span className="text-[0.8rem] font-light text-stone">
                    {h.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Chart ──

            Scrolls inside its own container below the sm breakpoint, at a
            floor wide enough to keep the axis readable. An 820-wide
            viewBox fitted to a 375px phone scales to 0.4 and renders the
            labels at 4.4px. Same treatment as the Long Term Growth chart
            and the tables — one pattern for wide content, everywhere. */}
        <figure className="mt-14">
          <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full min-w-[46rem] sm:min-w-0"
            role="img"
            aria-label={`Growth Maximisation against the ${BENCHMARK} since inception on ${INCEPTION}. The portfolio finishes at approximately ${pct(TRACED_TERMINAL.portfolio)} and the benchmark at approximately ${pct(TRACED_TERMINAL.benchmark)}. Traced from the supplied chart.`}
          >
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="currentColor"
                  /* Zero is a real boundary here — the portfolio spends its
                     first months below it — so it is drawn stronger. */
                  className={v === 0 ? "text-paper/25" : "text-paper/10"}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 12}
                  y={y(v) + 4}
                  textAnchor="end"
                  className="fill-stone-dim text-[11px]"
                >
                  {v === 0 ? "0%" : `+${v}%`}
                </text>
              </g>
            ))}

            {/* The shortfall against the benchmark, as an area. */}
            <path d={BAND} className="fill-ice/10" />

            <path
              d={path("benchmark")}
              fill="none"
              strokeWidth={1.5}
              strokeLinejoin="round"
              className="stroke-ice"
            />
            <path
              d={path("portfolio")}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              className="stroke-gold"
            />

            {/* Both ends of the period are anchored; nothing between them
                is dated, because the source does not date it. */}
            <text
              x={PAD.left}
              y={H - PAD.bottom + 22}
              textAnchor="start"
              className="fill-stone text-[11px] tracking-[0.08em]"
            >
              {INCEPTION}
            </text>
            <text
              x={W - PAD.right}
              y={H - PAD.bottom + 22}
              textAnchor="end"
              className="fill-stone text-[11px] tracking-[0.08em]"
            >
              End of supplied record
            </text>

            <text
              x={W - PAD.right + 12}
              y={y(TRACED_TERMINAL.benchmark) + 4}
              className="fill-ice text-[12px]"
            >
              {pct(TRACED_TERMINAL.benchmark)}
            </text>
            <text
              x={W - PAD.right + 12}
              y={y(TRACED_TERMINAL.portfolio) + 4}
              className="fill-gold text-[12px]"
            >
              {pct(TRACED_TERMINAL.portfolio)}
            </text>
          </svg>
          </div>

          <figcaption className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-[0.68rem] tracking-[0.06em] text-stone">
            <span className="block w-full text-stone-dim sm:hidden">
              Scroll the chart sideways to see it in full.
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-[2px] w-6 bg-gold" /> Portfolio
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-[2px] w-6 bg-ice" /> {BENCHMARK}
            </span>
            <span className="flex items-center gap-2">
              Cumulative return since inception
            </span>
          </figcaption>

          {/* The reproduction is checkable. */}
          <p className="mt-5 text-[0.68rem] leading-relaxed text-stone-dim">
            Redrawn from the supplied chart by pixel trace.{" "}
            <a
              href={CHART_SRC}
              target="_blank"
              rel="noreferrer"
              className="link-underline text-gold transition-colors duration-500 hover:text-gold-bright"
            >
              View the original supplied chart
            </a>{" "}
            to check this reproduction against its source.
          </p>
        </figure>

        {/* ── What this chart is not ── */}
        <div className="mt-14 border-t border-paper/10 pt-10">
          <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
            Basis of presentation
          </h3>
          <ul className="mt-6 grid grid-cols-1 gap-x-14 gap-y-5 lg:grid-cols-2">
            {CAVEATS.map((c) => (
              <li
                key={c.slice(0, 24)}
                className="max-w-[62ch] text-[0.78rem] font-light leading-[1.85] text-stone"
              >
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-10 max-w-[80ch] text-[0.65rem] leading-[1.9] tracking-wide text-stone-dim">
            These are the results of a personal account, presented as the
            record of a single strategy. They are not a firm-level track
            record, not audited, and not a composite. Past results are not an
            indicator of future results. Taizan Capital does not hold an
            Australian Financial Services Licence and is not accepting
            external clients or capital; nothing here is an offer or a
            recommendation.
          </p>
        </div>
      </div>
    </section>
  );
}
