import {
  ANNUAL,
  AS_AT,
  CAPITAL,
  CUMULATIVE,
  GAP_PP,
  INCEPTION,
  METHOD_NOTES,
  STATS,
  TERMINAL,
} from "@/data/longTermGrowthPerformance";

/**
 * Long Term Growth — return against an S&P 500 counterfactual.
 *
 * The chart is inline SVG, five marks per series, drawn on a categorical
 * axis. Five points do not justify a charting library, and a library's
 * defaults — smoothing, even time spacing, a tooltip on every pixel —
 * would each quietly misrepresent this particular dataset.
 *
 * ── WHY THE AXIS IS PER CENT AND NOT DOLLARS ────────────────────────
 * This drew the account balance until now: $1,109 climbing to $35,512.
 * That line rises steeply and says almost nothing, because nearly all of
 * the climb is money paid in rather than money made — net contributions
 * over the period were $30,559 of the $35,512. A reader takes the slope
 * as performance, and the slope was mostly deposits.
 *
 * It now plots cumulative time-weighted return, which is what the source
 * data actually supports and what removes contribution timing by
 * construction. Nothing was converted by dividing a balance by an assumed
 * base; the series is chain-linked from the measured financial-year
 * returns and reproduces the source's published +44.82% and +85.62%.
 *
 * The band between the two lines is still the point of the drawing. It is
 * the shortfall, and it widens. Nothing here is arranged to soften that:
 * the benchmark sits above the portfolio for the whole period after the
 * first mark, and the terminal gap is stated in percentage points
 * directly beneath the chart rather than left for the reader to compute.
 */

const W = 820;
const H = 380;
const PAD = { top: 24, right: 104, bottom: 40, left: 60 };
/** Per cent. The benchmark tops out at +85.6, so the axis runs to 100. */
const MAX = 100;

const x = (i: number) =>
  PAD.left + (i * (W - PAD.left - PAD.right)) / (CUMULATIVE.length - 1);
const y = (v: number) =>
  H - PAD.bottom - (v / MAX) * (H - PAD.top - PAD.bottom);

const path = (key: "portfolio" | "benchmark") =>
  CUMULATIVE.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p[key])}`).join(
    " ",
  );

const money = (n: number) =>
  `$${Math.round(Math.abs(n)).toLocaleString("en-AU")}`;

/** One decimal — the cumulative figure is method-sensitive to ~4 points. */
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const TERMINAL_CUM = CUMULATIVE[CUMULATIVE.length - 1];

export default function LongTermGrowthPerformance() {
  const band = [
    ...CUMULATIVE.map(
      (p, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(p.benchmark)}`,
    ),
    ...CUMULATIVE.map(
      (_, i) =>
        `L${x(CUMULATIVE.length - 1 - i)} ${y(
          CUMULATIVE[CUMULATIVE.length - 1 - i].portfolio,
        )}`,
    ),
    "Z",
  ].join(" ");

  return (
    <section
      aria-labelledby="ltg-performance-title"
      className="border-t border-paper/10"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2
            id="ltg-performance-title"
            className="text-[0.65rem] uppercase tracking-[0.28em] text-gold"
          >
            Performance
          </h2>
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-stone-dim">
            {INCEPTION} — {AS_AT}
          </p>
        </div>

        <p className="mt-8 max-w-[70ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
          Cumulative return since inception, with the effect of contribution
          timing removed — this is the return on the money, not the growth of
          the balance. The comparison is a counterfactual: the same
          contributions, on the same dates, invested instead in an ASX-listed
          S&amp;P 500 tracker with distributions reinvested. The portfolio has
          returned {pct(TERMINAL_CUM.portfolio)} against{" "}
          {pct(TERMINAL_CUM.benchmark)}. The shaded band is the difference,
          and it has widened.
        </p>

        {/* ── Chart ──

            Scrolls inside its own container on small screens. The viewBox
            is 820 wide; fitted to a 375px phone it scales to 0.4, which
            renders the axis labels at 4.4px. Percentage labels nobody can
            read are not an improvement on dollar labels nobody can read,
            so the chart holds a legible floor and scrolls instead. Same
            pattern as the stats table below. */}
        <figure className="mt-12">
          <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full min-w-[46rem] sm:min-w-0"
            role="img"
            aria-label={`Cumulative return against an S&P 500 counterfactual from ${INCEPTION} to ${AS_AT}. Portfolio ${pct(TERMINAL_CUM.portfolio)}, counterfactual ${pct(TERMINAL_CUM.benchmark)}, a shortfall of ${GAP_PP} percentage points.`}
          >
            {[0, 20, 40, 60, 80, 100].map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="currentColor"
                  /* The zero line is the reader's reference point — money in
                     with nothing yet earned — so it is drawn a shade
                     stronger than the rest of the grid. */
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

            {/* The shortfall, as an area. */}
            <path d={band} className="fill-ice/10" />

            <path
              d={path("benchmark")}
              fill="none"
              strokeWidth={1.75}
              className="stroke-ice"
            />
            <path
              d={path("portfolio")}
              fill="none"
              strokeWidth={2.75}
              className="stroke-gold"
            />

            {CUMULATIVE.map((p, i) => (
              <g key={p.label}>
                <circle cx={x(i)} cy={y(p.portfolio)} r={3} className="fill-gold" />
                <circle cx={x(i)} cy={y(p.benchmark)} r={2.5} className="fill-ice" />
                <text
                  x={x(i)}
                  y={H - PAD.bottom + 22}
                  textAnchor="middle"
                  className="fill-stone text-[11px] tracking-[0.08em]"
                >
                  {p.label}
                </text>
              </g>
            ))}

            {/* Terminal returns in the right margin. */}
            <text x={W - PAD.right + 12} y={y(TERMINAL_CUM.benchmark) + 4} className="fill-ice text-[12px]">
              {pct(TERMINAL_CUM.benchmark)}
            </text>
            <text x={W - PAD.right + 12} y={y(TERMINAL_CUM.portfolio) + 4} className="fill-gold text-[12px]">
              {pct(TERMINAL_CUM.portfolio)}
            </text>
            <text x={W - PAD.right + 12} y={y(TERMINAL_CUM.portfolio) + 20} className="fill-stone-dim text-[11px]">
              −{GAP_PP} pp behind
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
              <span className="inline-block h-[2px] w-6 bg-ice" /> S&amp;P 500
              counterfactual
            </span>
            <span className="flex items-center gap-2">
              Cumulative time-weighted return; zero is capital contributed and
              nothing yet earned
            </span>
          </figcaption>
        </figure>

        {/* ── Stats ── */}
        <div className="mt-16 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <caption className="sr-only">
              Portfolio and counterfactual returns since inception.
            </caption>
            <thead>
              <tr className="border-b border-paper/15">
                {["", "Portfolio", "S&P 500", ""].map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`py-4 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-stone ${
                      i === 0 ? "pr-6" : i === 3 ? "pl-6" : "pl-6 text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STATS.map((s) => (
                <tr key={s.label} className="border-b border-paper/10">
                  <th scope="row" className="py-5 pr-6 font-serif text-[1.05rem] font-normal text-paper">
                    {s.label}
                  </th>
                  <td className="tabular py-5 pl-6 text-right font-serif text-[1.25rem] text-paper">
                    {s.portfolio}
                  </td>
                  <td className="tabular py-5 pl-6 text-right font-serif text-[1.25rem] text-paper-dim">
                    {s.benchmark}
                  </td>
                  <td className="py-5 pl-6 text-[0.7rem] text-stone-dim">{s.note}</td>
                </tr>
              ))}
              {ANNUAL.map((a) => (
                <tr key={a.period} className="border-b border-paper/10">
                  <th scope="row" className="py-4 pr-6 text-[0.85rem] font-light text-stone">
                    {a.period}
                  </th>
                  <td className="tabular py-4 pl-6 text-right text-[0.9rem] text-paper">
                    +{a.portfolio.toFixed(2)}%
                  </td>
                  <td className="tabular py-4 pl-6 text-right text-[0.9rem] text-paper-dim">
                    +{a.benchmark.toFixed(2)}%
                  </td>
                  <td className="py-4 pl-6" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Balances, kept deliberately below the returns and in smaller
            type. They are real and worth stating, but they answer a
            different question, and the two gaps genuinely differ: the
            return is 40.8 points behind while the closing balance is only
            $2,620 behind, because most of the capital arrived late and so
            never experienced most of the shortfall. Left unexplained, that
            reads as a contradiction. */}
        <p className="mt-8 max-w-[86ch] text-[0.82rem] font-light leading-[1.9] text-stone">
          Net capital contributed {money(CAPITAL.net)}; gain{" "}
          {money(CAPITAL.gain)} after {money(CAPITAL.brokerage)} of brokerage.
          Dividends received {money(CAPITAL.dividends)}, with{" "}
          {money(CAPITAL.franking)} of franking credits excluded from every
          figure above. In balance terms the account closed at{" "}
          {money(TERMINAL.portfolio)} against {money(TERMINAL.benchmark)} for
          the counterfactual — {money(TERMINAL.gap)} lower, or{" "}
          {Math.abs(TERMINAL.gapPct)}%. That balance gap is much smaller than
          the {GAP_PP}-point return gap because most of the capital was
          contributed late in the period and so was never exposed to most of
          the shortfall.
        </p>

        {/* ── Method ── */}
        <div className="mt-14 border-t border-paper/10 pt-10">
          <h3 className="text-[0.62rem] uppercase tracking-[0.22em] text-stone">
            Basis of calculation
          </h3>
          <ul className="mt-6 grid grid-cols-1 gap-x-14 gap-y-5 lg:grid-cols-2">
            {METHOD_NOTES.map((n) => (
              <li
                key={n.slice(0, 24)}
                className="max-w-[62ch] text-[0.78rem] font-light leading-[1.85] text-stone"
              >
                {n}
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
