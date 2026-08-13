import { z } from "zod";

/**
 * Watchlist and thesis persistence.
 *
 * ── WHY THIS LIVES IN THE BROWSER ───────────────────────────────────
 * The site is public and has no accounts. A watchlist stored on the
 * server without authentication is not a private watchlist — it is one
 * global list every visitor shares and can edit, which is worse than not
 * having the feature. Adding accounts to solve that would put a login
 * wall on a site whose brief says it must not have one.
 *
 * So this is localStorage: private to the browser, no account, no
 * backend, nothing to run. The trade is stated on the page rather than
 * hidden — the data does not follow the reader to another device, and
 * clearing site data clears it. For a research scratchpad that is an
 * honest trade. If accounts ever exist, this module is the only thing
 * that has to change.
 *
 * ── WHY EVERYTHING IS PARSED ON READ ────────────────────────────────
 * localStorage is a string store that anything can write to, including
 * an older version of this code. A shape that changed between releases
 * would otherwise reach the UI as an object with missing fields and
 * throw somewhere far from the cause. Every read is validated and a
 * record that fails is dropped rather than repaired, because a repaired
 * thesis is a thesis nobody wrote.
 */

const KEY = "taizan.research.v1";

/* ── theses ───────────────────────────────────────────────────────── */

/**
 * Metrics a monitoring trigger can be written against.
 *
 * Deliberately restricted to figures the terminal actually holds and can
 * re-measure. A trigger on something unmeasurable would sit in the UI
 * looking like monitoring while never evaluating.
 */
export const TriggerMetric = z.enum([
  "price",
  "trailingPE",
  "priceToBook",
  "dividendYield",
  "marketCap",
  "revenueGrowth",
  "profitMargins",
  "returnOnEquity",
  "volatility1y",
  "maxDrawdown1y",
]);
export type TriggerMetric = z.infer<typeof TriggerMetric>;

export const TRIGGER_LABELS: Record<TriggerMetric, { label: string; unit: string }> = {
  price: { label: "Price", unit: "" },
  trailingPE: { label: "Trailing P/E", unit: "×" },
  priceToBook: { label: "Price / book", unit: "×" },
  dividendYield: { label: "Dividend yield", unit: "%" },
  marketCap: { label: "Market cap", unit: "" },
  revenueGrowth: { label: "Revenue growth", unit: "% (fraction)" },
  profitMargins: { label: "Net margin", unit: "% (fraction)" },
  returnOnEquity: { label: "Return on equity", unit: "% (fraction)" },
  volatility1y: { label: "Realised volatility 1y", unit: "%" },
  maxDrawdown1y: { label: "Max drawdown 1y", unit: "%" },
};

export const Trigger = z.object({
  id: z.string(),
  metric: TriggerMetric,
  op: z.enum(["above", "below"]),
  value: z.number().finite(),
  /** Why this level was chosen. Optional, but the useful part. */
  note: z.string().max(280).optional(),
});
export type Trigger = z.infer<typeof Trigger>;

/**
 * A thesis is the reader's own record, not the terminal's view.
 *
 * The terminal never writes one, never scores one and never suggests
 * one. It stores what the reader wrote, snapshots the figures that were
 * true when they wrote it, and later re-measures those same figures
 * against the conditions the reader themselves set. Every word of
 * judgement in the system belongs to the person who typed it.
 */
export const Thesis = z.object({
  symbol: z.string().min(1),
  name: z.string().nullable(),
  /** What the holder expects, in their words. */
  statement: z.string().max(2000),
  /** What they are relying on being true. */
  evidence: z.string().max(2000).optional(),
  horizon: z.string().max(80).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** Figures as at the moment the thesis was written. */
  snapshot: z.record(z.string(), z.number().nullable()).default({}),
  triggers: z.array(Trigger).default([]),
});
export type Thesis = z.infer<typeof Thesis>;

/* ── watchlist ────────────────────────────────────────────────────── */

export const WatchItem = z.object({
  symbol: z.string().min(1),
  name: z.string().nullable(),
  market: z.string().nullable(),
  securityType: z.string().nullable(),
  addedAt: z.string(),
  /** Optional note from the reader — why it is being watched. */
  note: z.string().max(280).optional(),
});
export type WatchItem = z.infer<typeof WatchItem>;

export const StoreShape = z.object({
  version: z.literal(1),
  watchlist: z.array(WatchItem).default([]),
  theses: z.array(Thesis).default([]),
});
export type StoreShape = z.infer<typeof StoreShape>;

export const EMPTY: StoreShape = { version: 1, watchlist: [], theses: [] };

/* ── persistence ──────────────────────────────────────────────────── */

export function readStore(): StoreShape {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = StoreShape.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;

    // A record that no longer matches the schema is dropped rather than
    // coerced. Salvage what still validates so one bad thesis does not
    // take the watchlist with it.
    const loose = JSON.parse(raw) as Record<string, unknown>;
    return {
      version: 1,
      watchlist: Array.isArray(loose.watchlist)
        ? loose.watchlist.flatMap((w) => {
            const r = WatchItem.safeParse(w);
            return r.success ? [r.data] : [];
          })
        : [],
      theses: Array.isArray(loose.theses)
        ? loose.theses.flatMap((t) => {
            const r = Thesis.safeParse(t);
            return r.success ? [r.data] : [];
          })
        : [],
    };
  } catch {
    return EMPTY;
  }
}

export function writeStore(next: StoreShape): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    // Other tabs listen for this; the storage event does not fire in the
    // tab that made the change.
    window.dispatchEvent(new CustomEvent("taizan:store"));
  } catch {
    /* quota or private mode — the UI reports the failure to persist */
  }
}

/* ── monitoring ───────────────────────────────────────────────────── */

export type TriggerState = "breached" | "holding" | "unmeasurable";

export interface TriggerResult {
  trigger: Trigger;
  state: TriggerState;
  current: number | null;
  /** Value when the thesis was written, where it was captured. */
  atWriting: number | null;
}

/**
 * Evaluate one condition against a current reading.
 *
 * ── "unmeasurable" IS NOT "holding" ─────────────────────────────────
 * If the figure is unavailable the condition cannot be evaluated, and
 * saying it holds would be the monitoring equivalent of rendering a
 * missing number as zero. A thesis whose triggers cannot be measured is
 * not a thesis that is intact — it is one nobody is checking, and the
 * page says so.
 */
export function evaluateTrigger(
  trigger: Trigger,
  current: number | null,
  atWriting: number | null,
): TriggerResult {
  if (current === null || !Number.isFinite(current)) {
    return { trigger, state: "unmeasurable", current: null, atWriting };
  }
  const breached =
    trigger.op === "above" ? current > trigger.value : current < trigger.value;
  return {
    trigger,
    state: breached ? "breached" : "holding",
    current,
    atWriting,
  };
}

export interface ThesisStatus {
  breached: number;
  holding: number;
  unmeasurable: number;
  results: TriggerResult[];
}

export function evaluateThesis(
  thesis: Thesis,
  current: Record<string, number | null>,
): ThesisStatus {
  const results = thesis.triggers.map((t) =>
    evaluateTrigger(t, current[t.metric] ?? null, thesis.snapshot[t.metric] ?? null),
  );
  return {
    breached: results.filter((r) => r.state === "breached").length,
    holding: results.filter((r) => r.state === "holding").length,
    unmeasurable: results.filter((r) => r.state === "unmeasurable").length,
    results,
  };
}

/** Percentage change between two readings, or null if either is absent. */
export function drift(from: number | null, to: number | null): number | null {
  if (from === null || to === null || from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}
