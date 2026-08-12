import {
  TOTAL_CAPITAL_USD,
  TOTAL_REALISED_AUD,
  TRADES,
  UNCATEGORISED_COSTS_NOTE,
  grossReturn,
} from "@/data/optionsResults";

/**
 * Options — realised trades.
 *
 * A tearsheet, not a trading app. Both results here are gains, and the
 * temptation in that situation is to colour them green and let the colour
 * do the arguing. Nothing is coloured by sign: a positive number reads the
 * same as a negative one would, and the reader is trusted to know which is
 * which from the figure. That restraint is the whole difference between an
 * institutional record and a screenshot from a brokerage app — and it is
 * the only presentation that will still look honest on the day a loss is
 * added to this table.
 *
 * Two rows do not need a chart. The table is the chart.
 */

const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;
const usd = (n: number) =>
  `US$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const aud = (n: number) =>
  `A$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OptionsResults() {
  return (
    <section
      aria-labelledby="options-results-title"
      className="border-t border-paper/10 bg-ink-soft"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2
            id="options-results-title"
            className="text-[0.65rem] uppercase tracking-[0.28em] text-gold"
          >
            Realised trades
          </h2>
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-stone-dim">
            {TRADES.length} closed positions
          </p>
        </div>

        <p className="mt-8 max-w-[68ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
          Every closed options position, in full. Two trades is not a track
          record, and neither the count nor the outcome should be read as
          one — a strategy whose losses are total by design will produce
          losing trades, and they will appear here in the same form when
          they do.
        </p>

        {/* Eight columns will not fit a phone. The table scrolls inside
            itself rather than the page widening, and no column is dropped:
            hiding delta or expiry on mobile would be showing a different,
            friendlier table to whoever is most likely to skim it. */}
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <caption className="sr-only">
              Realised options trades, showing entry and exit premiums,
              capital deployed, gross return, realised profit and delta.
            </caption>
            <thead>
              <tr className="border-b border-paper/15">
                {[
                  ["Position", "left"],
                  ["Expiry", "left"],
                  ["Entry", "right"],
                  ["Exit", "right"],
                  ["Capital", "right"],
                  ["Gross return", "right"],
                  ["Realised P&L", "right"],
                  ["Delta", "right"],
                ].map(([label, align]) => (
                  <th
                    key={label}
                    scope="col"
                    className={`py-4 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-stone ${
                      align === "right" ? "pl-6 text-right" : "pr-6"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRADES.map((t) => (
                <tr key={t.underlying} className="border-b border-paper/10">
                  <th scope="row" className="py-6 pr-6 font-normal">
                    <span className="font-serif text-[1.15rem] text-paper">
                      {t.underlying}
                    </span>
                    <span className="mt-1 block text-[0.72rem] tracking-[0.06em] text-stone">
                      {t.contract}
                    </span>
                  </th>
                  <td className="py-6 pr-6 text-[0.85rem] font-light text-stone">
                    {t.expiry}
                  </td>
                  <td className="tabular py-6 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {usd(t.entry)}
                  </td>
                  <td className="tabular py-6 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {usd(t.exit)}
                  </td>
                  <td className="tabular py-6 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {usd(t.capital)}
                  </td>
                  {/* The two figures the reader came for. Weight and scale
                      carry the emphasis — not hue. */}
                  <td className="tabular py-6 pl-6 text-right font-serif text-[1.3rem] text-paper">
                    {pct(grossReturn(t))}
                  </td>
                  <td className="tabular py-6 pl-6 text-right font-serif text-[1.3rem] text-paper">
                    {aud(t.realisedAud)}
                  </td>
                  <td className="tabular py-6 pl-6 text-right text-[0.85rem] text-paper-dim">
                    {t.deltaApproximate ? "~" : ""}
                    {t.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Combined ── */}
        <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-12">
          <dl className="grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2 lg:col-span-7">
            <div className="border-t border-paper/12 pt-6">
              <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-stone">
                Combined realised profit
              </dt>
              <dd className="tabular mt-3 font-serif text-3xl text-paper">
                {aud(TOTAL_REALISED_AUD)}
              </dd>
            </div>
            <div className="border-t border-paper/12 pt-6">
              <dt className="text-[0.62rem] uppercase tracking-[0.2em] text-stone">
                Combined capital deployed
              </dt>
              <dd className="tabular mt-3 font-serif text-3xl text-paper">
                {usd(TOTAL_CAPITAL_USD)}
              </dd>
            </div>
          </dl>

          <div className="lg:col-span-5">
            <p className="max-w-[52ch] text-[0.82rem] font-light leading-[1.9] text-stone">
              No combined percentage return is shown. Capital was committed
              in US dollars and the profit is recorded in Australian
              dollars; blending them into a single percentage would require
              an exchange rate and a date for each leg, and neither is
              recorded. The per-trade returns are exact because each is
              calculated from its own US dollar premiums.
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-paper/10 pt-10">
          <p className="max-w-[80ch] text-[0.65rem] leading-[1.9] tracking-wide text-stone-dim">
            {UNCATEGORISED_COSTS_NOTE} Returns are gross and before tax. The
            UNH expiry is recorded without a year in the source and is shown
            as supplied. The UNH delta is approximate and is marked as such;
            it is not a measured value. Past results are not an indicator of
            future results, nothing here is an offer or a recommendation,
            and Taizan Capital does not hold an Australian Financial
            Services Licence or accept external capital.
          </p>
        </div>
      </div>
    </section>
  );
}
