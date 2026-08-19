/**
 * The small shared pieces every company panel is built from.
 *
 * Extracted from CompanyClient so the panels can be split up without
 * each of them dragging a copy of the same table and grid along. No
 * behaviour changes here.
 *
 * ── Metric CARRIES THE DEFINITION ───────────────────────────────────
 * Every label rendered through these helpers can name a key in
 * definitions.ts, and where it does the reader gets an explanation
 * written for someone outside finance. A terminal that shows "P/B" to
 * a first-time visitor and explains nothing is only legible to people
 * who did not need it explained.
 */
"use client";

import type React from "react";
import {
  DASH,
  decimal,
  multiple,
  relativeTo,
  signedPercent,
} from "@/lib/research/format";
import { definitionText } from "@/lib/research/definitions";
import { Unavailable } from "@/components/research/TerminalChrome";
import type { DetailPayload } from "@/components/research/companyTypes";

export function H({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[0.62rem] uppercase tracking-[0.26em] text-gold">
      {children}
    </h2>
  );
}

export function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.58rem] uppercase tracking-[0.18em] text-stone-dim">
        {label}
      </dt>
      <dd className="mt-1.5 text-[0.85rem] text-paper-dim">{value}</dd>
    </div>
  );
}

/**
 * A grid of label/value pairs, each label optionally explainable.
 *
 * The third tuple slot is a key into definitions.ts. It is optional so
 * existing call sites keep working unchanged, and every one that adds a
 * key gains a plain-language explanation for a reader who does not know
 * what the label means.
 */
export function MetricsGrid({
  items,
  columns = 2,
}: {
  items: ([string, string] | [string, string, string])[];
  columns?: number;
}) {
  return (
    <dl
      className={`mt-6 grid grid-cols-1 gap-x-10 ${
        columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
      }`}
    >
      {items.map(([label, value, def]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-6 border-b border-paper/10 py-3"
        >
          <dt className="text-[0.72rem] text-stone">
            <Metric label={label} definition={def} />
          </dt>
          <dd className="tabular text-[0.9rem] text-paper">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ValuationRow({
  label,
  value,
  peer,
  count,
  kind = "multiple",
}: {
  label: string;
  value: number | null;
  peer: number | null;
  count: number;
  /** A multiple cannot be negative or zero and stay meaningful; a rate can. */
  kind?: "multiple" | "rate";
}) {
  const fmt = (v: number | null) =>
    kind === "multiple" ? multiple(v, 2) : v === null ? DASH : decimal(v, 2);
  const direction = relativeTo(value, peer);
  const delta =
    value !== null && peer !== null && peer !== 0
      ? ((value - peer) / Math.abs(peer)) * 100
      : null;

  return (
    <tr className="border-b border-paper/[0.07]">
      <th
        scope="row"
        className="py-3 pr-6 text-left text-[0.8rem] font-normal text-paper-dim"
      >
        {label}
      </th>
      <td className="tabular py-3 pl-6 text-right text-[0.88rem] text-paper">
        {fmt(value)}
      </td>
      <td className="tabular py-3 pl-6 text-right text-[0.88rem] text-stone">
        {fmt(peer)}
      </td>
      <td className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper-dim">
        {delta === null ? DASH : signedPercent(delta, 0)}
      </td>
      {/* Two different absences, and the reader deserves to know which.
          A blank company figure means the provider does not publish this
          multiple for this company — usually because it has no earnings.
          A blank median means the covered universe cannot support one. */}
      <td className="py-3 pl-6 text-[0.72rem] text-stone">
        {direction !== null
          ? `${direction} the median of ${count} covered companies`
          : value === null
            ? "Not published for this company"
            : "No sector median available"}
      </td>
    </tr>
  );
}

/**
 * Fund facts, and an honest account of what the register shows.
 *
 * ── THE COVERAGE LINE IS THE POINT ──────────────────────────────────
 * The provider returns the top ten holdings and never the full book.
 * Ten lines presented as "Holdings" reads as the whole portfolio, so
 * the weight those ten actually cover is stated beside them: ten names
 * covering 46.7% of VAS says something true, where a bare list implies
 * something false.
 *
 * Expense ratio arrives here already guarded — for ASX-listed funds the
 * provider sends a formatted 0.00%, which is not a cheap fund but a
 * missing figure. It renders as unavailable, with the reason given,
 * because understating the cost of holding an investment is the worst
 * direction for this particular number to be wrong in.
 */

export function big(v: number | null, currency: string | null): string {
  if (v === null) return DASH;
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  const c = currency ? `${currency} ` : "";
  for (const [size, suffix] of [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ] as [number, string][]) {
    if (a >= size) return `${sign}${c}${(a / size).toFixed(2)}${suffix}`;
  }
  return `${sign}${c}${a.toFixed(0)}`;
}

export const INCOME_ROWS: [string, keyof DetailPayload["income"][number]][] = [
  ["Revenue", "totalRevenue"],
  ["Cost of revenue", "costOfRevenue"],
  ["Gross profit", "grossProfit"],
  ["Research & development", "researchDevelopment"],
  ["Selling, general & admin", "sellingGeneralAdministrative"],
  ["Total operating expenses", "totalOperatingExpenses"],
  ["Operating income", "operatingIncome"],
  ["EBIT", "ebit"],
  ["Interest expense", "interestExpense"],
  ["Pre-tax income", "incomeBeforeTax"],
  ["Income tax", "incomeTaxExpense"],
  ["Net income", "netIncome"],
];

/**
 * A statement table: line items down, periods across.
 *
 * Rows with no figure in any period are dropped rather than rendered as
 * a row of em dashes — a statement is what was reported, not a list of
 * what was not.
 */
export function StatementTable<T extends { date: string | null }>({
  periods,
  rows,
  currency,
}: {
  periods: T[];
  rows: [string, keyof T][];
  currency: string | null;
}) {
  const present = rows.filter(([, key]) =>
    periods.some((p) => p[key] !== null && p[key] !== undefined),
  );
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-paper/15">
            <th className="py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone">
              Period ending
            </th>
            {periods.map((p) => (
              <th
                key={p.date ?? Math.random()}
                className="tabular py-3 pl-6 text-right text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone"
              >
                {p.date ?? DASH}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {present.map(([label, key]) => (
            <tr key={label} className="border-b border-paper/[0.07]">
              <th
                scope="row"
                className="py-3 pr-6 text-left text-[0.8rem] font-normal text-paper-dim"
              >
                {label}
              </th>
              {periods.map((p, i) => (
                <td
                  key={i}
                  className="tabular py-3 pl-6 text-right text-[0.85rem] text-paper"
                >
                  {big(p[key] as number | null, currency)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Shown where the statements provider does not reach a listing. */
export function StatementsUnavailable({ coverage }: { coverage: string }) {
  return (
    <Unavailable
      title="Financial statements"
      reason={
        coverage === "out-of-coverage"
          ? "The statements provider's plan covers United States listings only, and this security trades elsewhere. That is a limit of the subscription, not a statement that the company does not file — its accounts are published by its own exchange. Nothing is estimated in their place, and the quote provider's own statement feed returns these periods with every line item stripped."
          : "No statements provider is configured, so only the figures the quote provider carries are available. Balance-sheet and cash-flow periods arrive from it with their line items stripped, which is why neither is shown rather than shown empty."
      }
    />
  );
}


/**
 * A label with its plain-language definition attached.
 *
 * The dotted underline is the only affordance — it marks the label as
 * explainable without turning every row into a control. Screen readers
 * get the same text through aria-label, because a definition available
 * only on hover is not available to everyone.
 */
export function Metric({
  label,
  definition,
}: {
  label: string;
  definition?: string;
}) {
  const text = definition ? definitionText(definition) : undefined;
  if (!text) return <>{label}</>;
  return (
    <span
      title={text}
      aria-label={`${label}. ${text}`}
      className="cursor-help decoration-stone-dim/50 decoration-dotted underline-offset-4 [text-decoration-line:underline]"
    >
      {label}
    </span>
  );
}
