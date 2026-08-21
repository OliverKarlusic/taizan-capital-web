"use client";

import { Plus, X } from "lucide-react";
import {
  type Condition,
  type Group,
  type NumericField,
  type Operator,
  type Scope,
} from "@/lib/research/filters";

/**
 * Building a screen out of conditions.
 *
 * ── WHY THE SCOPE SELECTOR IS THE IMPORTANT CONTROL ─────────────────
 * The three scopes are three different questions that all sound like
 * "is this cheap":
 *
 *   absolute        P/E under 15
 *   percentile      P/E in the cheapest quartile of everything covered
 *   sector-relative P/E below its own sector's median
 *
 * A bank on 12x and a software company on 12x are not comparably
 * valued, and only the third can say so. Putting scope beside the
 * number rather than hiding it in a mode toggle makes the reader choose
 * which question they are asking, every time they add a condition.
 *
 * ── AND WHY GROUPS ARE ONE LEVEL DEEP ───────────────────────────────
 * Conditions inside a group join by AND or OR; groups join to each
 * other by AND. That expresses the shape screens are actually written
 * in — "large cap AND (cheap OR high-yielding)" — without an
 * arbitrary-depth expression tree that the interface would then have to
 * let people build, read and debug.
 */

const FIELDS: { key: NumericField; label: string; hint: string }[] = [
  { key: "marketCap", label: "Market cap", hint: "in dollars" },
  { key: "trailingPE", label: "P/E", hint: "" },
  { key: "priceToBook", label: "P/B", hint: "" },
  { key: "dividendYield", label: "Yield %", hint: "" },
  { key: "price", label: "Price", hint: "" },
  { key: "changePercent", label: "Change %", hint: "" },
];

const OPS: { key: Operator; label: string }[] = [
  { key: "lt", label: "<" },
  { key: "lte", label: "≤" },
  { key: "gt", label: ">" },
  { key: "gte", label: "≥" },
  { key: "between", label: "between" },
];

const SCOPES: { key: Scope; label: string; help: string }[] = [
  {
    key: "absolute",
    label: "value",
    help: "Compare against the number you type.",
  },
  {
    key: "percentile",
    label: "percentile",
    help: "Compare against a rank across everything covered. 25 means the value a quarter of the way up the list.",
  },
  {
    key: "sectorRelative",
    label: "× sector median",
    help: "Compare against this company's own sector. 1 is the sector median, 0.8 is twenty per cent below it.",
  },
];

const uid = () => Math.random().toString(36).slice(2, 9);

export const newCondition = (): Condition => ({
  id: uid(),
  field: "trailingPE",
  op: "lt",
  value: 15,
  scope: "absolute",
});

export const newGroup = (): Group => ({
  id: uid(),
  join: "AND",
  conditions: [newCondition()],
});

export default function FilterBuilder({
  groups,
  onChange,
  excluded,
}: {
  groups: Group[];
  onChange: (g: Group[]) => void;
  /** Rows the conditions could not judge for want of data. */
  excluded: number;
}) {
  const setGroup = (id: string, next: Group) =>
    onChange(groups.map((g) => (g.id === id ? next : g)));

  const setCondition = (gid: string, c: Condition) => {
    const g = groups.find((x) => x.id === gid);
    if (!g) return;
    setGroup(gid, {
      ...g,
      conditions: g.conditions.map((x) => (x.id === c.id ? c : x)),
    });
  };

  return (
    <div className="mt-6 border-t border-paper/10 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
          Conditions
        </h3>
        <button
          type="button"
          onClick={() => onChange([...groups, newGroup()])}
          className="inline-flex min-h-11 items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-stone transition-colors hover:text-gold"
        >
          <Plus size={12} strokeWidth={1.5} />
          Add group
        </button>
      </div>

      {!groups.length ? (
        <p className="mt-3 max-w-[70ch] text-[0.72rem] leading-[1.85] text-stone-dim">
          No conditions set — every covered company is listed. Add a group
          to narrow it. Conditions inside a group combine with AND or OR;
          groups combine with each other using AND.
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {groups.map((g, gi) => (
          <div key={g.id} className="border border-paper/12 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                {gi > 0 ? (
                  <span className="text-[0.58rem] uppercase tracking-[0.2em] text-stone-dim">
                    and
                  </span>
                ) : null}
                <div
                  role="group"
                  aria-label="Combine conditions in this group"
                  className="flex"
                >
                  {(["AND", "OR"] as const).map((j) => (
                    <button
                      key={j}
                      type="button"
                      aria-pressed={g.join === j}
                      onClick={() => setGroup(g.id, { ...g, join: j })}
                      className={`min-h-11 px-3 text-[0.6rem] uppercase tracking-[0.18em] transition-colors ${
                        g.join === j
                          ? "bg-gold text-ink"
                          : "text-stone hover:text-paper"
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setGroup(g.id, {
                      ...g,
                      conditions: [...g.conditions, newCondition()],
                    })
                  }
                  className="inline-flex min-h-11 items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-stone transition-colors hover:text-gold"
                >
                  <Plus size={11} strokeWidth={1.5} />
                  Condition
                </button>
                <button
                  type="button"
                  aria-label="Remove this group"
                  onClick={() => onChange(groups.filter((x) => x.id !== g.id))}
                  className="inline-flex min-h-11 items-center text-stone-dim transition-colors hover:text-ice"
                >
                  <X size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {g.conditions.map((c, ci) => {
                const scope = SCOPES.find((s) => s.key === c.scope)!;
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-2 text-[0.72rem]"
                  >
                    <span className="w-8 shrink-0 text-[0.58rem] uppercase tracking-[0.16em] text-stone-dim">
                      {ci === 0 ? "" : g.join.toLowerCase()}
                    </span>

                    <select
                      aria-label="Field"
                      value={c.field}
                      onChange={(e) =>
                        setCondition(g.id, {
                          ...c,
                          field: e.target.value as NumericField,
                        })
                      }
                      className="min-h-11 border border-paper/15 bg-transparent px-2 text-paper-dim"
                    >
                      {FIELDS.map((f) => (
                        <option key={f.key} value={f.key} className="bg-ink">
                          {f.label}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Operator"
                      value={c.op}
                      onChange={(e) =>
                        setCondition(g.id, {
                          ...c,
                          op: e.target.value as Operator,
                        })
                      }
                      className="min-h-11 border border-paper/15 bg-transparent px-2 text-paper-dim"
                    >
                      {OPS.map((o) => (
                        <option key={o.key} value={o.key} className="bg-ink">
                          {o.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      aria-label="Value"
                      value={c.value}
                      step="any"
                      onChange={(e) =>
                        setCondition(g.id, {
                          ...c,
                          value: Number(e.target.value),
                        })
                      }
                      className="min-h-11 w-24 border border-paper/15 bg-transparent px-2 text-paper"
                    />

                    {c.op === "between" ? (
                      <input
                        type="number"
                        aria-label="Upper value"
                        value={c.value2 ?? ""}
                        step="any"
                        placeholder="and"
                        onChange={(e) =>
                          setCondition(g.id, {
                            ...c,
                            value2: Number(e.target.value),
                          })
                        }
                        className="min-h-11 w-24 border border-paper/15 bg-transparent px-2 text-paper"
                      />
                    ) : null}

                    <select
                      aria-label="Compare against"
                      title={scope.help}
                      value={c.scope}
                      onChange={(e) =>
                        setCondition(g.id, {
                          ...c,
                          scope: e.target.value as Scope,
                          // A percentile of 15 and a P/E of 15 are not the
                          // same request. Switching scope resets to a
                          // sensible figure for the new one rather than
                          // silently reinterpreting the old number.
                          value:
                            e.target.value === "percentile"
                              ? 25
                              : e.target.value === "sectorRelative"
                                ? 1
                                : c.value,
                        })
                      }
                      className="min-h-11 cursor-help border border-paper/15 bg-transparent px-2 text-stone"
                    >
                      {SCOPES.map((s) => (
                        <option key={s.key} value={s.key} className="bg-ink">
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      aria-label="Remove this condition"
                      onClick={() =>
                        setGroup(g.id, {
                          ...g,
                          conditions: g.conditions.filter((x) => x.id !== c.id),
                        })
                      }
                      className="inline-flex min-h-11 items-center text-stone-dim transition-colors hover:text-ice"
                    >
                      <X size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {excluded > 0 ? (
        <p className="mt-4 max-w-[76ch] text-[0.68rem] leading-[1.85] text-stone-dim">
          {excluded.toLocaleString("en-AU")}{" "}
          {excluded === 1 ? "company is" : "companies are"} not judged by
          these conditions because the data source publishes no value for a
          field being tested — most often a company with no earnings, which
          has no price-to-earnings ratio at all. They are excluded rather
          than passed, in either direction. A condition and its opposite
          will therefore return fewer companies together than are covered,
          and the difference is this number.
        </p>
      ) : null}
    </div>
  );
}
