"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Star, X } from "lucide-react";
import { useResearchStore } from "./useResearchStore";
import {
  TRIGGER_LABELS,
  TriggerMetric,
  type Thesis,
  type Trigger,
} from "@/lib/research/store";

/**
 * Writing a thesis, and adding to the watchlist, from a company page.
 *
 * ── THE SNAPSHOT IS THE POINT ───────────────────────────────────────
 * Saving records the figures as they stand at that moment. Without it,
 * monitoring can only say what a metric is now — with it, the page can
 * show what changed since the view was formed, which is the question
 * someone revisiting a thesis actually has. The snapshot is captured
 * once and never rewritten; re-saving an edited thesis keeps the
 * original so the comparison stays honest.
 *
 * ── THE TERMINAL WRITES NOTHING HERE ────────────────────────────────
 * No suggested statement, no prefilled conditions, no template opinion.
 * Every judgement in the record belongs to the person typing it. What
 * the terminal contributes is arithmetic: the current readings, and
 * later whether the levels they named have been reached.
 */

const METRICS = TriggerMetric.options;

export default function ThesisEditor({
  symbol,
  name,
  market,
  securityType,
  metrics,
}: {
  symbol: string;
  name: string | null;
  market: string | null;
  securityType: string | null;
  /** Current readings, snapshotted on save. */
  metrics: Record<string, number | null>;
}) {
  const { ready, isWatched, toggleWatch, thesisFor, saveThesis } =
    useResearchStore();
  const existing = thesisFor(symbol);

  const [open, setOpen] = useState(false);
  const [statement, setStatement] = useState("");
  const [evidence, setEvidence] = useState("");
  const [horizon, setHorizon] = useState("");
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [saved, setSaved] = useState(false);

  const start = () => {
    if (existing) {
      setStatement(existing.statement);
      setEvidence(existing.evidence ?? "");
      setHorizon(existing.horizon ?? "");
      setTriggers(existing.triggers);
    }
    setOpen(true);
    setSaved(false);
  };

  const addTrigger = () =>
    setTriggers((t) => [
      ...t,
      {
        id: `${Date.now()}-${t.length}`,
        metric: "price",
        op: "below",
        value: 0,
      },
    ]);

  const update = (id: string, patch: Partial<Trigger>) =>
    setTriggers((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = () => {
    if (!statement.trim()) return;
    const now = new Date().toISOString();
    const thesis: Thesis = {
      symbol,
      name,
      statement: statement.trim(),
      evidence: evidence.trim() || undefined,
      horizon: horizon.trim() || undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      // Keep the original snapshot on edit — rewriting it would erase
      // the very comparison the monitoring page exists to make.
      snapshot: existing?.snapshot ?? metrics,
      triggers: triggers.filter((t) => Number.isFinite(t.value)),
    };
    saveThesis(thesis);
    setSaved(true);
    setOpen(false);
  };

  if (!ready) return null;

  return (
    <div className="mt-8 border-t border-paper/10 pt-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() =>
            toggleWatch({ symbol, name, market, securityType, })
          }
          className={`inline-flex min-h-11 items-center gap-2 border px-4 text-[0.65rem] uppercase tracking-[0.2em] transition-colors duration-300 ${
            isWatched(symbol)
              ? "border-gold/50 text-gold"
              : "border-paper/15 text-stone hover:border-gold/40 hover:text-gold"
          }`}
        >
          <Star
            size={13}
            strokeWidth={1.5}
            fill={isWatched(symbol) ? "currentColor" : "none"}
          />
          {isWatched(symbol) ? "Watching" : "Add to watchlist"}
        </button>

        <button
          type="button"
          onClick={start}
          className="inline-flex min-h-11 items-center gap-2 border border-paper/15 px-4 text-[0.65rem] uppercase tracking-[0.2em] text-stone transition-colors duration-300 hover:border-gold/40 hover:text-gold"
        >
          <Plus size={13} strokeWidth={1.5} />
          {existing ? "Edit thesis" : "Record a thesis"}
        </button>

        {existing && !open ? (
          <Link
            href="/research/thesis"
            className="inline-flex min-h-11 items-center text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
          >
            {existing.triggers.length} condition
            {existing.triggers.length === 1 ? "" : "s"} monitored
          </Link>
        ) : null}

        {saved ? (
          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            Saved to this browser
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="mt-6 max-w-4xl border border-paper/12 bg-ink-soft p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-[0.62rem] uppercase tracking-[0.26em] text-gold">
              Your thesis on {symbol}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-stone-dim hover:text-paper"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          <label className="mt-6 block">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">
              What you expect
            </span>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="In your own words. Nothing here is generated or suggested."
              className="mt-2 w-full border border-paper/15 bg-ink p-3 text-[0.85rem] leading-relaxed text-paper placeholder:text-stone-dim focus:border-gold/50 focus:outline-none"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">
              What you are relying on
            </span>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="The evidence behind it — figures, filings, disclosures."
              className="mt-2 w-full border border-paper/15 bg-ink p-3 text-[0.85rem] leading-relaxed text-paper placeholder:text-stone-dim focus:border-gold/50 focus:outline-none"
            />
          </label>

          <label className="mt-5 block max-w-xs">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">
              Horizon
            </span>
            <input
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              maxLength={80}
              placeholder="e.g. three years"
              className="mt-2 w-full border border-paper/15 bg-ink px-3 py-3 text-[0.85rem] text-paper placeholder:text-stone-dim focus:border-gold/50 focus:outline-none sm:py-2"
            />
          </label>

          {/* ── Conditions ── */}
          <div className="mt-8 border-t border-paper/10 pt-6">
            <h4 className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">
              Conditions that would change your mind
            </h4>
            <p className="mt-2 max-w-[70ch] text-[0.7rem] leading-relaxed text-stone-dim">
              Measurable levels only, on figures this terminal holds. These
              are re-checked against current data and reported when met. A
              thesis with no conditions is kept, but nothing about it can be
              monitored.
            </p>

            <ul className="mt-5 space-y-3">
              {triggers.map((t) => (
                <li key={t.id} className="flex flex-wrap items-end gap-3">
                  <label className="block">
                    <span className="sr-only">Metric</span>
                    <select
                      value={t.metric}
                      onChange={(e) =>
                        update(t.id, { metric: e.target.value as TriggerMetric })
                      }
                      className="border border-paper/15 bg-ink px-3 py-3 text-[0.8rem] text-paper focus:border-gold/50 focus:outline-none sm:py-2"
                    >
                      {METRICS.map((m) => (
                        <option key={m} value={m} className="bg-ink">
                          {TRIGGER_LABELS[m].label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="sr-only">Direction</span>
                    <select
                      value={t.op}
                      onChange={(e) =>
                        update(t.id, { op: e.target.value as "above" | "below" })
                      }
                      className="border border-paper/15 bg-ink px-3 py-3 text-[0.8rem] text-paper focus:border-gold/50 focus:outline-none sm:py-2"
                    >
                      <option value="below" className="bg-ink">falls below</option>
                      <option value="above" className="bg-ink">rises above</option>
                    </select>
                  </label>
                  <label className="block w-32">
                    <span className="sr-only">Level</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={Number.isFinite(t.value) ? t.value : ""}
                      onChange={(e) =>
                        update(t.id, { value: Number(e.target.value) })
                      }
                      className="w-full border border-paper/15 bg-ink px-3 py-3 text-[0.8rem] text-paper focus:border-gold/50 focus:outline-none sm:py-2"
                    />
                  </label>
                  <span className="pb-2 text-[0.65rem] text-stone-dim">
                    now {metrics[t.metric] === null || metrics[t.metric] === undefined
                      ? "unavailable"
                      : Number(metrics[t.metric]).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTriggers((x) => x.filter((y) => y.id !== t.id))
                    }
                    aria-label="Remove condition"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-stone-dim hover:text-ice"
                  >
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={addTrigger}
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
            >
              <Plus size={13} strokeWidth={1.5} /> Add a condition
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-paper/10 pt-6">
            <button
              type="button"
              onClick={save}
              disabled={!statement.trim()}
              className="min-h-11 border border-gold/50 px-6 text-[0.65rem] uppercase tracking-[0.2em] text-gold transition-colors duration-300 enabled:hover:bg-gold enabled:hover:text-ink disabled:opacity-35"
            >
              Save thesis
            </button>
            <p className="text-[0.65rem] text-stone-dim">
              Stored in this browser only. Current readings are captured now
              so later changes can be measured against them.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
