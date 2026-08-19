/**
 * One place that decides whether a request may go out.
 *
 * ── WHAT THIS REPLACES ──────────────────────────────────────────────
 * Nothing scheduled anything. A company page fired its own calls, the
 * screener fanned out sixty quote requests to build a sector median,
 * and two readers arriving together doubled all of it. On a free tier
 * the failure mode is not a slow page — it is a 429 and a terminal that
 * shows dashes everywhere, which looks exactly like missing data and is
 * not.
 *
 * ── THE THREE THINGS IT DOES ────────────────────────────────────────
 * 1. Deduplicates. Identical in-flight requests share one promise, so
 *    the sector median asking for BHP.AX while the page header also
 *    asks for it costs one call, not two.
 * 2. Budgets. Each provider declares calls per window; the budgeter
 *    refuses to exceed it and reports how much is left.
 * 3. Queues rather than drops. Over budget means waiting for the window
 *    to roll, not failing — a slower answer is still an answer, and a
 *    dropped one becomes a dash the reader misreads as absent data.
 *
 * ── WHY IN-MEMORY IS HONEST HERE ────────────────────────────────────
 * This lives in one serverless instance and resets on a cold start, so
 * it cannot enforce a global quota across concurrent instances. It is a
 * guard against this instance's own bursts — which is where the waste
 * actually was — and not a distributed limiter. Saying so matters: a
 * budgeter that quietly under-counts is worse than none, because it
 * invites reliance it cannot support.
 */

export interface BudgetSpec {
  /** Maximum calls permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface BudgetState {
  provider: string;
  used: number;
  limit: number;
  /** Milliseconds until the window rolls. */
  resetsInMs: number;
}

interface Window {
  count: number;
  startedAt: number;
}

export class Budgeter {
  private readonly specs = new Map<string, BudgetSpec>();
  private readonly windows = new Map<string, Window>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    specs: Record<string, BudgetSpec>,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((r) => setTimeout(r, ms)),
  ) {
    for (const [k, v] of Object.entries(specs)) this.specs.set(k, v);
  }

  private window(provider: string): Window {
    const spec = this.specs.get(provider);
    const w = this.windows.get(provider);
    const t = this.now();
    if (!w || (spec && t - w.startedAt >= spec.windowMs)) {
      const fresh = { count: 0, startedAt: t };
      this.windows.set(provider, fresh);
      return fresh;
    }
    return w;
  }

  /** How much of a provider's budget is left right now. */
  state(provider: string): BudgetState {
    const spec = this.specs.get(provider);
    const w = this.window(provider);
    return {
      provider,
      used: w.count,
      limit: spec?.limit ?? Infinity,
      resetsInMs: spec ? Math.max(0, spec.windowMs - (this.now() - w.startedAt)) : 0,
    };
  }

  /**
   * Run `load` under the provider's budget, sharing the result with any
   * identical request already in flight.
   *
   * `key` must identify the request completely — same key means same
   * answer. A key that collides across different requests would serve
   * one caller another's data, which is why callers build it from the
   * full URL rather than from a symbol alone.
   */
  async run<T>(
    provider: string,
    key: string,
    load: () => Promise<T>,
  ): Promise<T> {
    const dedupeKey = `${provider}:${key}`;
    const existing = this.inFlight.get(dedupeKey);
    if (existing) return existing as Promise<T>;

    const spec = this.specs.get(provider);

    const task = (async () => {
      if (spec) {
        // Wait out the window rather than failing. Bounded by one
        // window length, because the window rolls on the next check.
        for (;;) {
          const w = this.window(provider);
          if (w.count < spec.limit) {
            w.count++;
            break;
          }
          await this.sleep(
            Math.max(1, spec.windowMs - (this.now() - w.startedAt)),
          );
        }
      }
      return load();
    })();

    this.inFlight.set(dedupeKey, task);
    try {
      return await task;
    } finally {
      // Cleared on settle so a later caller re-fetches rather than
      // receiving a resolved promise from an earlier window.
      this.inFlight.delete(dedupeKey);
    }
  }

  /** Requests currently sharing a promise. Exposed for tests. */
  get inFlightCount(): number {
    return this.inFlight.size;
  }
}

/**
 * The site's budgeter.
 *
 * ── WHERE THESE NUMBERS COME FROM ───────────────────────────────────
 * FMP publishes 250 calls per day on the free plan, so that limit is
 * the provider's own and is set here with a day-long window.
 *
 * Yahoo's endpoints are undocumented and publish no quota, so the 600
 * per minute below is not a limit anyone stated — it is a self-imposed
 * ceiling chosen to keep this application's bursts civil. It is
 * deliberately generous enough not to slow ordinary use and low enough
 * to stop a runaway loop like the one the price chart shipped with
 * earlier. Do not read it as documentation of what Yahoo permits.
 */
export const budgeter = new Budgeter({
  yahoo: { limit: 600, windowMs: 60_000 },
  fmp: { limit: 250, windowMs: 24 * 60 * 60_000 },
});
