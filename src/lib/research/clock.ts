/**
 * Every date and time this site displays, resolved in Australian Eastern.
 *
 * ── WHY A MODULE RATHER THAN toLocaleString AT EACH CALL SITE ────────
 * `toLocaleString("en-AU", …)` sets the *format* to Australian and leaves
 * the *timezone* as whatever the machine rendering it happens to be in.
 * The locale tag looks like it pins the zone. It does not. So the same
 * instant read "15 Aug" in Sydney and "14 Aug" in London, and on a
 * server-rendered page it read as UTC — Vercel's zone — which is ten
 * hours behind the market this firm actually reports on.
 *
 * A research page that stamps a figure with a date is making a claim
 * about which trading session that figure belongs to. That claim cannot
 * depend on where the reader is sitting.
 *
 * ── AND WHY THE ZONE IS NAMED ON SCREEN ─────────────────────────────
 * Every formatter here can append AEST/AEDT. Intl switches the
 * abbreviation across the October and April transitions on its own, so
 * the label stays honest through daylight saving without a table to
 * maintain.
 */

export const MARKET_TZ = "Australia/Sydney";

/**
 * The instant a data point cannot be later than.
 *
 * Providers occasionally return a bar for a session that has not
 * happened — a placeholder for the current day stamped at its open, or a
 * calendar row that ran ahead. Displaying one states that a session
 * occurred and produced a close when it did not, which is the same class
 * of error as inventing the number outright.
 */
export const isFuture = (epochSeconds: number, now = Date.now()): boolean =>
  epochSeconds * 1000 > now;

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-AU", { timeZone: MARKET_TZ, ...opts });

/** "15 Aug 2026" — a trading session, in the market's own zone. */
export const marketDate = (d: Date | string | number): string =>
  fmt({ day: "numeric", month: "short", year: "numeric" }).format(toDate(d));

/** "15 Aug, 14:32 AEST" — a retrieval stamp, zone named. */
export const marketDateTime = (d: Date | string | number): string =>
  fmt({
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  })
    .format(toDate(d))
    // Intl renders "15 Aug, 2:32 pm AEST"; the comma before the zone is
    // absent and the string reads better with the parts separated.
    .replace(/\s([A-Z]{4,5})$/, " $1");

/** "Aug 26" — compact axis label for a chart tick. */
export const axisMonth = (epochSeconds: number): string =>
  fmt({ month: "short", year: "2-digit" }).format(new Date(epochSeconds * 1000));

/** The calendar date in Sydney right now, as YYYY-MM-DD. */
export function todayInMarket(now = new Date()): string {
  // en-CA formats as ISO, which avoids parsing a localised string back.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MARKET_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function toDate(d: Date | string | number): Date {
  if (d instanceof Date) return d;
  if (typeof d === "number") return new Date(d);
  return new Date(d);
}
