/**
 * Whether a market is open, and what that makes the price on screen.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────
 * "Delayed, not real time" is true at every hour, which makes it less
 * useful than it looks. A price at 02:00 Sydney on a Sunday is not
 * delayed by twenty minutes — it is Friday's close, and calling it
 * delayed invites the reader to think it is nearly current. The state
 * below separates a price that is moving from one that stopped moving
 * two days ago.
 *
 * ── HOLIDAYS ARE DERIVED FROM RULES, NOT TYPED IN ───────────────────
 * Every closure is computed from the published rule that defines it —
 * third Monday in February, the Friday before Easter — with Easter from
 * the anonymous Gregorian algorithm. Nothing here is a remembered date,
 * because a remembered date is a fabricated one whenever the memory is
 * wrong, and a wrong holiday silently mislabels a real trading session
 * as a closure.
 *
 * ── AND WHAT THIS CALENDAR CANNOT KNOW ──────────────────────────────
 * Unscheduled closures — a national day of mourning, a trading halt, an
 * exchange outage — follow no rule and are not here. So this answers
 * "should the market be open", and the observed data answers "did a
 * session happen". Where they disagree the data wins, and nothing on
 * screen is ever suppressed because this calendar disagreed with it.
 */

export type SessionState = "pre" | "open" | "post" | "closed" | "holiday";

export interface MarketSession {
  state: SessionState;
  /** IANA zone the judgement was made in. */
  timezone: string;
  /** Local date at the exchange, YYYY-MM-DD. */
  localDate: string;
  /** Phrase for the freshness label beside a price. */
  label: string;
}

interface ExchangeSpec {
  timezone: string;
  /** Local minutes from midnight. */
  preOpen: number;
  open: number;
  close: number;
  postClose: number;
  holidays: (year: number) => Set<string>;
}

/* ── date helpers ─────────────────────────────────────────────────── */

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Nth (1-based) weekday of a month; weekday 0 = Sunday. */
function nthWeekday(y: number, m: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  return iso(y, m, day);
}

/** Last given weekday of a month. */
function lastWeekday(y: number, m: number, weekday: number): string {
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dow = new Date(Date.UTC(y, m - 1, last)).getUTCDay();
  return iso(y, m, last - ((dow - weekday + 7) % 7));
}

/** Easter Sunday, anonymous Gregorian algorithm. */
function easter(y: number): { m: number; d: number } {
  const a = y % 19;
  const b = Math.floor(y / 100);
  const c = y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return {
    m: Math.floor((h + l - 7 * m + 114) / 31),
    d: ((h + l - 7 * m + 114) % 31) + 1,
  };
}

function shift(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** A weekend holiday is observed on the adjacent weekday. */
function observed(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (dow === 6) return shift(isoDate, -1);
  if (dow === 0) return shift(isoDate, 1);
  return isoDate;
}

/* ── calendars ────────────────────────────────────────────────────── */

/** NYSE and Nasdaq, from the exchanges' published rules. */
function usHolidays(y: number): Set<string> {
  const e = easter(y);
  const easterSunday = iso(y, e.m, e.d);
  return new Set([
    observed(iso(y, 1, 1)),
    nthWeekday(y, 1, 1, 3),
    nthWeekday(y, 2, 1, 3),
    shift(easterSunday, -2),
    lastWeekday(y, 5, 1),
    observed(iso(y, 6, 19)),
    observed(iso(y, 7, 4)),
    nthWeekday(y, 9, 1, 1),
    nthWeekday(y, 11, 4, 4),
    observed(iso(y, 12, 25)),
  ]);
}

/**
 * The ASX, which observes NSW public holidays.
 *
 * Christmas and Boxing Day roll together rather than separately: putting
 * each through `observed` on its own would land both on the same
 * weekday and lose a closure.
 */
function asxHolidays(y: number): Set<string> {
  const e = easter(y);
  const easterSunday = iso(y, e.m, e.d);
  const out = new Set([
    observed(iso(y, 1, 1)),
    observed(iso(y, 1, 26)),
    shift(easterSunday, -2),
    shift(easterSunday, 1),
    iso(y, 4, 25),
    nthWeekday(y, 6, 1, 2),
  ]);

  const christmas = iso(y, 12, 25);
  const dow = new Date(Date.UTC(y, 11, 25)).getUTCDay();
  if (dow === 6) {
    out.add(shift(christmas, 2));
    out.add(shift(christmas, 3));
  } else if (dow === 0) {
    out.add(shift(christmas, 1));
    out.add(shift(christmas, 2));
  } else if (dow === 5) {
    out.add(christmas);
    out.add(shift(christmas, 3));
  } else {
    out.add(christmas);
    out.add(shift(christmas, 1));
  }
  return out;
}

const HM = (h: number, m = 0) => h * 60 + m;

export const EXCHANGES: Record<string, ExchangeSpec> = {
  ASX: {
    timezone: "Australia/Sydney",
    preOpen: HM(7),
    open: HM(10),
    close: HM(16),
    postClose: HM(17),
    holidays: asxHolidays,
  },
  US: {
    timezone: "America/New_York",
    preOpen: HM(4),
    open: HM(9, 30),
    close: HM(16),
    postClose: HM(20),
    holidays: usHolidays,
  },
};

/** Which calendar a symbol belongs to; null where none is configured. */
export function exchangeFor(symbol: string): string | null {
  const s = symbol.toUpperCase();
  if (s.endsWith(".AX")) return "ASX";
  if (s.startsWith("^")) return null;
  if (!s.includes(".")) return "US";
  return null;
}

/** Local wall-clock parts at an exchange, for an instant. */
function localParts(now: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    // Intl renders midnight as 24 in some engines under hour12:false.
    minutes: (Number(p.hour) % 24) * 60 + Number(p.minute),
    weekday: p.weekday,
    year: Number(p.year),
  };
}

export function marketSession(
  symbol: string,
  now: Date = new Date(),
): MarketSession | null {
  const key = exchangeFor(symbol);
  if (!key) return null;
  const spec = EXCHANGES[key];
  const { date, minutes, weekday, year } = localParts(now, spec.timezone);

  const weekend = weekday === "Sat" || weekday === "Sun";
  const holiday = spec.holidays(year).has(date);

  let state: SessionState;
  if (weekend) state = "closed";
  else if (holiday) state = "holiday";
  else if (minutes < spec.preOpen) state = "closed";
  else if (minutes < spec.open) state = "pre";
  else if (minutes < spec.close) state = "open";
  else if (minutes < spec.postClose) state = "post";
  else state = "closed";

  const label =
    state === "open"
      ? "Market open"
      : state === "pre"
        ? "Pre-market — last close until the open"
        : state === "post"
          ? "After hours — regular session has closed"
          : state === "holiday"
            ? "Exchange holiday — last completed session"
            : "Market closed — last completed session";

  return { state, timezone: spec.timezone, localDate: date, label };
}

/**
 * A one-line state for a surface that spans several markets.
 *
 * ── WHY NOT A SINGLE STATE ──────────────────────────────────────────
 * The screener lists ASX, NYSE and Nasdaq together, and those are open
 * at different times — at 14:00 Sydney one is trading and the other
 * has been shut for hours. Picking one and labelling the whole page
 * with it would be wrong for half the rows, so both are named.
 */
export function sessionSummary(now: Date = new Date()): string {
  const parts: string[] = [];
  for (const [name, probe] of [
    ["ASX", "BHP.AX"],
    ["US", "AAPL"],
  ] as const) {
    const s = marketSession(probe, now);
    if (!s) continue;
    parts.push(
      `${name} ${
        s.state === "open"
          ? "open"
          : s.state === "pre"
            ? "pre-market"
            : s.state === "post"
              ? "after hours"
              : s.state === "holiday"
                ? "holiday"
                : "closed"
      }`,
    );
  }
  return parts.join(" · ");
}
