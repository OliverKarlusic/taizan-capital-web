import { z } from "zod";

/**
 * The boundary between the provider and everything else.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────
 * Nothing downstream of here should know what shape Yahoo returns. The
 * UI previously read provider-shaped objects directly, which is how a
 * provider placeholder — {raw: 0, fmt: null} — reached the screen as
 * "$0 cost of revenue" against $215.9bn of revenue. A parse step that
 * knows the difference between an absent number and a zero is the only
 * durable defence, because it cannot be forgotten at a call site.
 *
 * ── THE ONE INVARIANT ───────────────────────────────────────────────
 * A value that was not reported is `null`. Never 0, never "", never a
 * neighbouring period's figure, never an average. Every schema below
 * encodes that, and the tests in src/lib/research/__tests__ assert it
 * against real captured provider payloads.
 */

/* ── primitives ───────────────────────────────────────────────────── */

/**
 * A provider-wrapped number: { raw, fmt }.
 *
 * `fmt: null` alongside `raw: 0` is the provider's marker for a field it
 * has stripped, not a company that reported zero. Verified empirically
 * across US and ASX equities and ETFs — see scripts/audit-placeholders.mjs.
 * A genuine zero always carries a formatted string.
 */
export const WrappedNumber = z.unknown().transform((v): number | null => {
  // Deliberately tolerant: a malformed field degrades to null rather
  // than throwing. A strict shape here meant one NaN from the provider
  // rejected the entire statement, turning a single bad field into a
  // blank page. Validation at a provider boundary has to absorb bad
  // input, not amplify it.
  if (!v || typeof v !== "object") return null;
  const o = v as { raw?: unknown; fmt?: unknown };
  if (typeof o.raw !== "number" || !Number.isFinite(o.raw)) return null;
  if (o.raw === 0 && o.fmt === null) return null;
  return o.raw;
});

/** A bare number, as the batch-quote endpoint returns. Absent → null. */
export const BareNumber = z
  .unknown()
  .transform((v): number | null =>
    typeof v === "number" && Number.isFinite(v) ? v : null,
  );

/** A provider date wrapper; we keep the formatted date, not the epoch. */
export const WrappedDate = z.unknown().transform((v): string | null => {
  if (!v || typeof v !== "object") return null;
  const fmt = (v as { fmt?: unknown }).fmt;
  return typeof fmt === "string" && fmt.trim() ? fmt : null;
});

export const NullableString = z
  .unknown()
  .transform((v): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null,
  );

/* ── security master ──────────────────────────────────────────────── */

/**
 * What kind of thing a symbol is.
 *
 * The terminal must not present an ETF as if it were a company — an ETF
 * has no cost of revenue, no ROE and no insider register, and rendering
 * those as "unavailable" implies the data is merely missing rather than
 * inapplicable. Yahoo's quoteType is the source; anything unrecognised
 * stays `unknown` rather than being forced into "equity".
 */
export const SecurityType = z.enum([
  "equity",
  "etf",
  "index",
  "mutualfund",
  "currency",
  "crypto",
  "future",
  "option",
  "unknown",
]);
export type SecurityType = z.infer<typeof SecurityType>;

export function toSecurityType(quoteType: unknown): SecurityType {
  const t = String(quoteType ?? "").toLowerCase();
  const map: Record<string, SecurityType> = {
    equity: "equity",
    etf: "etf",
    index: "index",
    mutualfund: "mutualfund",
    currency: "currency",
    cryptocurrency: "crypto",
    future: "future",
    option: "option",
  };
  return map[t] ?? "unknown";
}

/**
 * Which market a listing trades on, derived from the provider's exchange
 * name rather than assumed from a hardcoded map, so it stays correct for
 * any symbol the provider covers rather than only for a curated list.
 */
export function toMarket(exchange: unknown, symbol: string): string {
  if (symbol.toUpperCase().endsWith(".AX")) return "ASX";
  const e = String(exchange ?? "").toLowerCase();
  if (!e) return "—";
  if (e.includes("nasdaq")) return "Nasdaq";
  if (e.includes("nyse") && e.includes("arca")) return "NYSE Arca";
  if (e.includes("nyse")) return "NYSE";
  if (e.includes("asx")) return "ASX";
  if (e.includes("cboe")) return "Cboe";
  if (e.includes("bats")) return "BATS";
  return String(exchange);
}

export const SecurityRef = z.object({
  symbol: z.string().min(1),
  name: z.string().nullable(),
  exchange: z.string().nullable(),
  market: z.string(),
  securityType: SecurityType,
  currency: z.string().nullable(),
});
export type SecurityRef = z.infer<typeof SecurityRef>;

/* ── provider payloads ────────────────────────────────────────────── */

export const QuoteSchema = z
  .object({
    symbol: z.string(),
    longName: NullableString.optional(),
    shortName: NullableString.optional(),
    displayName: NullableString.optional(),
    currency: NullableString.optional(),
    fullExchangeName: NullableString.optional(),
    exchange: NullableString.optional(),
    quoteType: z.unknown().optional(),
    regularMarketPrice: BareNumber.optional(),
    regularMarketChangePercent: BareNumber.optional(),
    marketCap: BareNumber.optional(),
    trailingPE: BareNumber.optional(),
    forwardPE: BareNumber.optional(),
    priceToBook: BareNumber.optional(),
    dividendYield: BareNumber.optional(),
    fiftyTwoWeekLow: BareNumber.optional(),
    fiftyTwoWeekHigh: BareNumber.optional(),
    regularMarketVolume: BareNumber.optional(),
    marketState: NullableString.optional(),
    exchangeDataDelayedBy: BareNumber.optional(),
  })
  .passthrough();

/** One period of an income statement, after placeholder stripping. */
export const IncomePeriodSchema = z
  .object({
    endDate: WrappedDate,
    totalRevenue: WrappedNumber,
    costOfRevenue: WrappedNumber,
    grossProfit: WrappedNumber,
    researchDevelopment: WrappedNumber,
    sellingGeneralAdministrative: WrappedNumber,
    totalOperatingExpenses: WrappedNumber,
    operatingIncome: WrappedNumber,
    ebit: WrappedNumber,
    interestExpense: WrappedNumber,
    incomeBeforeTax: WrappedNumber,
    incomeTaxExpense: WrappedNumber,
    netIncome: WrappedNumber,
  })
  .passthrough();

export type IncomePeriod = z.infer<typeof IncomePeriodSchema>;

/**
 * Provenance travelling with a figure.
 *
 * Section 6 of the brief: every number needs a source, a period, a
 * retrieval timestamp, a currency and a status. Attaching it to the
 * value rather than to the page means a figure cannot be moved somewhere
 * else and lose its provenance on the way.
 */
export const DataStatus = z.enum([
  "live",
  "delayed",
  "historical",
  "reported",
  "estimated",
  "calculated",
  "unavailable",
]);
export type DataStatus = z.infer<typeof DataStatus>;

export interface Sourced<T> {
  value: T;
  source: string;
  /** The period the figure describes, e.g. "FY2026" or "as at 30 Jun 2026". */
  period: string | null;
  /** When it was retrieved. ISO 8601. */
  retrievedAt: string;
  currency: string | null;
  status: DataStatus;
  /** For calculated values, the formula applied. */
  method?: string;
}

export const sourced = <T>(
  value: T,
  meta: Omit<Sourced<T>, "value">,
): Sourced<T> => ({ value, ...meta });
