"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useResearchStore } from "./useResearchStore";
import {
  TRIGGER_LABELS,
  drift,
  evaluateThesis,
  type Thesis,
  type ThesisStatus,
  type TriggerMetric,
} from "@/lib/research/store";
import { DASH, decimal, signedPercent } from "@/lib/research/format";

/**
 * Thesis monitoring.
 *
 * ── WHAT THIS DOES AND DOES NOT DO ──────────────────────────────────
 * It re-measures the figures a reader named, against the levels that
 * same reader set, and reports which conditions have been met. It does
 * not form a view, score a thesis, or suggest an action. "Two of your
 * conditions have been met" is a measurement of someone's own stated
 * criteria. "This thesis is broken, sell" would be advice, and the firm
 * behind this terminal is not licensed to give it.
 *
 * The distinction is load-bearing in the wording throughout: conditions
 * are "met", never "triggered a sell"; a thesis is never "failing".
 */

/** Pull the metrics a trigger can reference out of a company payload. */
function currentMetrics(payload: {
  quote?: { price?: number | null; trailingPE?: number | null; priceToBook?: number | null; dividendYield?: number | null; marketCap?: number | null };
  fundamentals?: Record<string, number | null>;
  risk?: Record<string, number | null>;
}): Record<string, number | null> {
  const q = payload.quote ?? {};
  const f = payload.fundamentals ?? {};
  const r = payload.risk ?? {};
  return {
    price: q.price ?? null,
    trailingPE: q.trailingPE ?? null,
    priceToBook: q.priceToBook ?? null,
    dividendYield: q.dividendYield ?? null,
    marketCap: q.marketCap ?? null,
    revenueGrowth: f.revenueGrowth ?? null,
    profitMargins: f.profitMargins ?? null,
    returnOnEquity: f.returnOnEquity ?? null,
    volatility1y: r.volatility1y ?? null,
    maxDrawdown1y: r.maxDrawdown1y ?? null,
  };
}

const fmtMetric = (metric: TriggerMetric, v: number | null) => {
  if (v === null) return DASH;
  if (metric === "marketCap") {
    const abs = Math.abs(v);
    for (const [size, s] of [[1e12, "T"], [1e9, "B"], [1e6, "M"]] as [number, string][]) {
      if (abs >= size) return `${(v / size).toFixed(2)}${s}`;
    }
    return decimal(v, 0);
  }
  return decimal(v, 2);
};

export default function ThesisClient() {
  const { store, ready, removeThesis } = useResearchStore();
  const [status, setStatus] = useState<Record<string, ThesisStatus>>({});
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [failed, setFailed] = useState<string[]>([]);

  const check = useCallback(async (theses: Thesis[]) => {
    if (!theses.length) return;
    setLoading(true);
    const next: Record<string, ThesisStatus> = {};
    const errors: string[] = [];
    await Promise.all(
      theses.map(async (t) => {
        try {
          const r = await fetch(
            `/api/research/company/${encodeURIComponent(t.symbol)}`,
          );
          if (!r.ok) {
            errors.push(t.symbol);
            return;
          }
          next[t.symbol] = evaluateThesis(t, currentMetrics(await r.json()));
        } catch {
          errors.push(t.symbol);
        }
      }),
    );
    setStatus(next);
    setFailed(errors);
    setCheckedAt(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) void check(store.theses);
    // Re-checking on every store change would refetch while the reader is
    // still typing a thesis; the symbol list is the meaningful trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, store.theses.map((t) => t.symbol).join(","), check]);

  if (!ready) {
    return <p className="py-16 text-[0.85rem] text-stone">Reading your theses…</p>;
  }

  if (!store.theses.length) {
    return (
      <div className="mt-10 border border-dashed border-paper/15 px-6 py-16 text-center">
        <p className="mx-auto max-w-[58ch] text-[0.95rem] font-light leading-[1.9] text-paper-dim">
          No thesis has been recorded yet.
        </p>
        <p className="mx-auto mt-4 max-w-[58ch] text-[0.82rem] font-light leading-[1.85] text-stone">
          Open a company&apos;s research page and write one. State what you
          expect and the measurable conditions that would change your mind;
          this page then re-measures those conditions against current data
          and reports which have been met. It does not form a view of its
          own.
        </p>
        <Link
          href="/research"
          className="mt-7 inline-flex min-h-11 items-center text-[0.7rem] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
        >
          Go to the screener
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[0.65rem] tracking-wide">
        <span className="text-stone">
          {store.theses.length} {store.theses.length === 1 ? "thesis" : "theses"}
        </span>
        {checkedAt ? (
          <span className="text-stone-dim">
            Conditions checked{" "}
            {new Date(checkedAt).toLocaleString("en-AU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · against delayed data
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void check(store.theses)}
          className="min-h-11 text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
        >
          {loading ? "Checking…" : "Re-check"}
        </button>
      </div>

      {failed.length ? (
        <p className="mt-4 text-[0.7rem] text-ice">
          Could not retrieve current data for {failed.join(", ")}. Those
          conditions are shown as unmeasurable rather than assumed intact.
        </p>
      ) : null}

      <div className="mt-8 space-y-10">
        {store.theses.map((t) => {
          const s = status[t.symbol];
          return (
            <article key={t.symbol} className="border-t border-paper/12 pt-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/research/${encodeURIComponent(t.symbol)}`}
                    className="group inline-flex items-baseline gap-3"
                  >
                    <span className="tabular text-[0.75rem] uppercase tracking-[0.2em] text-gold group-hover:text-gold-bright">
                      {t.symbol}
                    </span>
                    <span className="font-serif text-xl text-paper">
                      {t.name ?? t.symbol}
                    </span>
                  </Link>
                  <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-stone-dim">
                    Recorded {new Date(t.createdAt).toLocaleDateString("en-AU")}
                    {t.horizon ? ` · horizon ${t.horizon}` : ""}
                  </p>
                </div>

                {s ? (
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[0.7rem]">
                    <span className={s.breached ? "text-ice" : "text-stone-dim"}>
                      {s.breached} met
                    </span>
                    <span className="text-stone">{s.holding} not met</span>
                    {s.unmeasurable ? (
                      <span className="text-stone-dim">
                        {s.unmeasurable} unmeasurable
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <p className="mt-5 max-w-[76ch] text-[0.9rem] font-light leading-[1.9] text-paper-dim">
                {t.statement}
              </p>
              {t.evidence ? (
                <p className="mt-3 max-w-[76ch] text-[0.8rem] font-light leading-[1.85] text-stone">
                  <span className="uppercase tracking-[0.16em] text-stone-dim">
                    Relying on ·{" "}
                  </span>
                  {t.evidence}
                </p>
              ) : null}

              {t.triggers.length ? (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[40rem] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-paper/12">
                        {["Condition", "When written", "Now", "Change", "State"].map(
                          (h, i) => (
                            <th
                              key={h}
                              scope="col"
                              className={`py-2 text-[0.55rem] font-medium uppercase tracking-[0.2em] text-stone ${
                                i === 0 || i === 4 ? "" : "pl-5 text-right"
                              }`}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(s?.results ?? t.triggers.map((tr) => ({ trigger: tr, state: "unmeasurable" as const, current: null, atWriting: t.snapshot[tr.metric] ?? null }))).map(
                        (res) => {
                          const d = drift(res.atWriting, res.current);
                          return (
                            <tr key={res.trigger.id} className="border-b border-paper/[0.07]">
                              <td className="py-3 pr-5">
                                <span className="text-[0.8rem] text-paper-dim">
                                  {TRIGGER_LABELS[res.trigger.metric].label}{" "}
                                  {res.trigger.op}{" "}
                                  <span className="tabular text-paper">
                                    {fmtMetric(res.trigger.metric, res.trigger.value)}
                                  </span>
                                </span>
                                {res.trigger.note ? (
                                  <span className="mt-1 block max-w-[44ch] text-[0.7rem] font-light italic leading-snug text-stone">
                                    {res.trigger.note}
                                  </span>
                                ) : null}
                              </td>
                              <td className="tabular py-3 pl-5 text-right text-[0.8rem] text-stone">
                                {fmtMetric(res.trigger.metric, res.atWriting)}
                              </td>
                              <td className="tabular py-3 pl-5 text-right text-[0.85rem] text-paper">
                                {fmtMetric(res.trigger.metric, res.current)}
                              </td>
                              <td className="tabular py-3 pl-5 text-right text-[0.8rem] text-paper-dim">
                                {d === null ? DASH : signedPercent(d, 1)}
                              </td>
                              <td className="py-3 pl-5">
                                <span
                                  className={`text-[0.7rem] ${
                                    res.state === "breached"
                                      ? "text-ice"
                                      : res.state === "holding"
                                        ? "text-stone"
                                        : "text-stone-dim"
                                  }`}
                                >
                                  {res.state === "breached"
                                    ? "Condition met"
                                    : res.state === "holding"
                                      ? "Not met"
                                      : "Unmeasurable"}
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-5 max-w-[70ch] text-[0.78rem] leading-[1.8] text-stone-dim">
                  No measurable conditions were set, so nothing here is being
                  monitored. A thesis without conditions is a note, which is a
                  legitimate thing to keep — but this page cannot tell you
                  when it stops holding.
                </p>
              )}

              <button
                type="button"
                onClick={() => removeThesis(t.symbol)}
                className="mt-5 min-h-11 text-[0.62rem] uppercase tracking-[0.2em] text-stone-dim transition-colors duration-300 hover:text-ice"
              >
                Delete this thesis
              </button>
            </article>
          );
        })}
      </div>

      <p className="mt-14 max-w-[86ch] text-[0.65rem] leading-[1.85] text-stone-dim">
        Conditions are the ones you set, re-measured against delayed market
        data. &ldquo;Condition met&rdquo; states that a level you named has
        been reached; it is not a recommendation to act, and this terminal
        does not make one. A condition whose figure is unavailable is shown
        as unmeasurable rather than assumed to be holding. Theses are stored
        in this browser only.
      </p>
    </div>
  );
}
