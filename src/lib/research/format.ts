/**
 * Display formatting for the Research Terminal.
 *
 * ── ONE RULE ────────────────────────────────────────────────────────
 * null in, em dash out. Every formatter here accepts null and returns
 * DASH for it, so a missing figure is impossible to render as a zero by
 * forgetting a guard at the call site. This is the last line of defence
 * for Section 0 of the brief and it belongs in one place.
 */

export const DASH = "—";

/** Shown where a ratio exists arithmetically but carries no meaning. */
export const NOT_MEANINGFUL = "N/M";

/**
 * A multiple that is negative is not a cheap multiple — it is not a
 * multiple at all.
 *
 * A company with negative earnings produces a negative price/earnings
 * ratio, and the provider returns it: NEXTDC's forward P/E came back as
 * −35.64. Rendered as a number in a valuation table it reads as a figure
 * to compare against a peer's 22×, and sorting on it puts loss-making
 * companies at the "cheapest" end of the column. The arithmetic is real;
 * the meaning is not.
 *
 * These render as N/M rather than as a value or an em dash, because the
 * two say different things: an em dash means the provider did not supply
 * it, N/M means it was supplied and cannot be interpreted.
 */
export const meaningfulRatio = (v: number | null): number | null =>
  v === null || v <= 0 ? null : v;

export const isNotMeaningful = (v: number | null): boolean =>
  v !== null && v <= 0;

/** Formats an earnings-based multiple, marking negatives as N/M. */
export const multiple = (v: number | null, places = 1): string => {
  if (v === null) return DASH;
  if (v <= 0) return NOT_MEANINGFUL;
  return significant(v, places);
};

const nf = (min: number, max: number) =>
  new Intl.NumberFormat("en-AU", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

/**
 * Round to `places`, but never round a non-zero value down to zero.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────
 * The feed returns a price-to-book of 0.00104 for Berkshire Hathaway B.
 * That figure is almost certainly wrong at the source, but correcting a
 * provider's number is not this application's job — misrepresenting it
 * is, though, and at one decimal place it rendered as "0.0". A reader
 * cannot tell that apart from a true zero or from a missing value.
 *
 * So precision widens until a significant digit survives, up to a limit.
 * A small number then looks small and stays honest, and a genuine zero —
 * a stock that closed unchanged — still renders as "0.00".
 */
function significant(v: number, places: number): string {
  if (v === 0) return nf(places, places).format(0);
  for (let p = places; p <= 6; p++) {
    const rounded = Number(v.toFixed(p));
    if (rounded !== 0) return nf(p, p).format(v);
  }
  // Smaller than 1e-6 and still not zero: say so rather than print zeros.
  return v > 0 ? "<0.000001" : ">−0.000001";
}

export const ratio = (v: number | null): string =>
  v === null ? DASH : significant(v, 1) + "×";

/** Plain decimal, for ratios that are not conventionally suffixed. */
export const decimal = (v: number | null, places = 2): string =>
  v === null ? DASH : significant(v, places);

/** Already a percentage, e.g. 3.06 → "3.06%". */
export const percent = (v: number | null, places = 2): string =>
  v === null ? DASH : significant(v, places) + "%";

/** A fraction, e.g. 0.164 → "16.4%". */
export const fraction = (v: number | null, places = 1): string =>
  v === null ? DASH : significant(v * 100, places) + "%";

/** Signed, for changes. Uses a true minus sign, not a hyphen. */
export const signedPercent = (v: number | null, places = 2): string => {
  if (v === null) return DASH;
  const s = significant(Math.abs(v), places) + "%";
  if (v > 0) return `+${s}`;
  if (v < 0) return `−${s}`;
  return s;
};

export function money(v: number | null, currency: string | null): string {
  if (v === null) return DASH;
  const c = currency ? `${currency} ` : "";
  return c + nf(2, 2).format(v);
}

/** 4_449_911_701_504 → "4.45T". Compact, because a table has no room. */
export function marketCap(v: number | null, currency: string | null): string {
  if (v === null) return DASH;
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  const c = currency ? `${currency} ` : "";
  for (const [size, suffix] of units) {
    if (Math.abs(v) >= size) return `${c}${nf(2, 2).format(v / size)}${suffix}`;
  }
  return c + nf(0, 0).format(v);
}

export const integer = (v: number | null): string =>
  v === null ? DASH : nf(0, 0).format(v);

/**
 * Neutral comparison language.
 *
 * ── WHY THIS FUNCTION HAS THE VOCABULARY IT HAS ─────────────────────
 * It returns "above", "below" or "in line with" and nothing else. Not
 * "cheap", not "expensive", not "attractive", not "stretched" — each of
 * those is a judgement, and a judgement about a security's price is
 * exactly what an unlicensed firm may not publish. The direction of a
 * difference is a fact. Whether that difference is good is not.
 */
export function relativeTo(
  value: number | null,
  reference: number | null,
  tolerance = 0.05,
): "above" | "below" | "in line with" | null {
  if (value === null || reference === null || reference === 0) return null;
  const delta = (value - reference) / Math.abs(reference);
  if (Math.abs(delta) <= tolerance) return "in line with";
  return delta > 0 ? "above" : "below";
}
