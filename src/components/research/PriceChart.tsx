"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HistoryPayload } from "@/app/api/research/history/[ticker]/route";
import { RANGE_KEYS, type RangeKey } from "@/lib/research/ranges";
import { axisMonth, marketDate, marketDateTime } from "@/lib/research/clock";
import { DASH, decimal, signedPercent } from "@/lib/research/format";

/**
 * The price chart an analyst can actually read a number off.
 *
 * ── WHAT REPLACED WHAT ──────────────────────────────────────────────
 * The previous chart was a static path with a fixed twelve-month
 * window. It showed a shape. Nobody could ask it what a security closed
 * at on a given day, which is the first question anyone brings to a
 * price series.
 *
 * ── ON READING A VALUE OFF IT ───────────────────────────────────────
 * Pointer and keyboard both drive the same cursor. Arrow keys step one
 * observation, Home and End jump to the ends, and the focused chart
 * announces the point through a live region — so the series is legible
 * without a mouse, which matters because the whole point of this
 * control is extracting exact figures rather than impressions.
 *
 * The cursor snaps to a real observation. It never interpolates between
 * two closes to follow the pointer: a readout of 341.06 that no session
 * ever printed is a fabricated figure, and this terminal does not
 * publish those even transiently under a crosshair.
 *
 * ── ON RANGES ───────────────────────────────────────────────────────
 * A range with no data is disabled and says why, rather than falling
 * back to whatever shorter window the provider substitutes. A company
 * listed last year genuinely has no five-year series, and showing one
 * anyway — or silently showing eighteen months under a "5Y" label —
 * would misstate the security's own history.
 */

interface Props {
  symbol: string;
  currency: string | null;
  low: number | null;
  high: number | null;
  /** Server-rendered first paint, so the chart is never briefly empty. */
  initial: { points: { t: number; c: number }[]; observations: number };
}

const W = 900;
const H = 300;
const PAD = { top: 16, right: 76, bottom: 30, left: 12 };

/**
 * Describe the spacing the series actually has, not the one requested.
 *
 * The provider does not always honour the interval: MAX asks for months
 * and returns roughly quarters. Naming the requested bar size over that
 * data would claim a resolution the series does not have, which is the
 * same failure as an axis label that reads as a date.
 */
function spacingLabel(days: number | null, intraday: boolean): string {
  if (intraday) return "intraday bars";
  if (days === null) return "irregular spacing";
  if (days <= 1.5) return "daily bars";
  if (days <= 4) return "daily bars, sessions only";
  if (days <= 10) return "weekly bars";
  if (days <= 45) return "monthly bars";
  if (days <= 120) return "quarterly bars";
  return "annual bars";
}

export default function PriceChart({
  symbol,
  currency,
  low,
  high,
  initial,
}: Props) {
  const [range, setRange] = useState<RangeKey>("1Y");
  const [data, setData] = useState<HistoryPayload | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [cursor, setCursor] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  /** Ranges the feed has already told us are empty for this symbol. */
  const [empty, setEmpty] = useState<Set<RangeKey>>(new Set());

  const svgRef = useRef<SVGSVGElement>(null);
  const reqRef = useRef(0);

  const points = data?.points ?? initial.points;
  const intraday = data?.intraday ?? false;
  const observations = data?.observations ?? initial.observations;

  /**
   * Whether the server's 1Y series has been consumed for this symbol.
   *
   * ── WHY A REF AND NOT `data` IN THE DEPENDENCIES ────────────────────
   * The first version guarded with `!data` and listed `data` in the
   * dependency array. Since the effect also calls setData, every
   * response re-ran the effect and issued another request: a fetch loop
   * that never settled. It also called setCursor(null) on each response,
   * so the crosshair was wiped a few milliseconds after any keypress and
   * the chart looked like it had no keyboard support at all.
   *
   * This is the same shape as the bug already documented on the detail
   * fetch above — state written inside an effect that depends on that
   * state. A ref records "the initial series has been used" without
   * being a dependency, so the effect runs exactly once per symbol and
   * range.
   */
  const servedInitial = useRef(false);

  useEffect(() => {
    // A new symbol brings a fresh server-rendered 1Y series with it.
    servedInitial.current = false;
    setData(null);
    setCursor(null);
    setEmpty(new Set());
  }, [symbol]);

  useEffect(() => {
    // 1Y on first view is what the server already sent; re-fetching it
    // would be a wasted round trip for the view the reader starts on.
    if (range === "1Y" && !servedInitial.current) {
      servedInitial.current = true;
      return;
    }
    const id = ++reqRef.current;
    setState("loading");
    fetch(`/api/research/history/${encodeURIComponent(symbol)}?range=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: HistoryPayload) => {
        if (id !== reqRef.current) return; // a later range won the race
        setData(j);
        setState("idle");
        setCursor(null);
        if (!j.available) setEmpty((s) => new Set(s).add(range));
      })
      .catch(() => {
        if (id === reqRef.current) setState("error");
      });
  }, [symbol, range]);

  const geom = useMemo(() => {
    if (points.length < 2) return null;
    const closes = points.map((p) => p.c);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || Math.max(max * 0.02, 1);
    const lo = min - span * 0.08;
    const hi = max + span * 0.08;
    const x = (i: number) =>
      PAD.left + (i * (W - PAD.left - PAD.right)) / (points.length - 1);
    const y = (v: number) =>
      H - PAD.bottom - ((v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.c).toFixed(1)}`)
      .join(" ");
    return { min, max, lo, hi, x, y, line };
  }, [points]);

  const first = points[0];
  const last = points[points.length - 1];
  const change =
    first && last && first.c ? ((last.c - first.c) / first.c) * 100 : null;
  const up = (change ?? 0) >= 0;

  const active = cursor === null ? null : points[cursor];

  /** Nearest observation to a client-x, in SVG space. */
  const pick = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || points.length < 2) return;
      const r = svg.getBoundingClientRect();
      const px = ((clientX - r.left) / r.width) * W;
      const frac =
        (px - PAD.left) / (W - PAD.left - PAD.right);
      const i = Math.round(frac * (points.length - 1));
      setCursor(Math.max(0, Math.min(points.length - 1, i)));
    },
    [points.length],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (points.length < 2) return;
    const step = (d: number) =>
      setCursor((c) =>
        Math.max(0, Math.min(points.length - 1, (c ?? points.length - 1) + d)),
      );
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "Home") { e.preventDefault(); setCursor(0); }
    else if (e.key === "End") { e.preventDefault(); setCursor(points.length - 1); }
    else if (e.key === "Escape") { setCursor(null); }
  };

  const stamp = (t: number) =>
    intraday ? marketDateTime(t * 1000) : marketDate(t * 1000);

  const readout = active
    ? `${stamp(active.t)} · ${decimal(active.c)}${currency ? ` ${currency}` : ""}`
    : null;

  return (
    <figure className={expanded ? "fixed inset-0 z-50 overflow-y-auto bg-ink px-6 py-10 lg:px-12" : "mb-12"}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <h2 className="text-[0.62rem] uppercase tracking-[0.26em] text-gold">
            Price
          </h2>
          {change !== null ? (
            <span className={`tabular text-[0.8rem] ${up ? "text-gold" : "text-ice"}`}>
              {signedPercent(change)}
              <span className="ml-2 text-[0.62rem] uppercase tracking-[0.16em] text-stone-dim">
                over {range}
              </span>
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex min-h-11 items-center text-[0.62rem] uppercase tracking-[0.2em] text-stone transition-colors hover:text-gold"
        >
          {expanded ? "Close" : "Expand"}
        </button>
      </div>

      {/* Range selector. Disabled where the feed returned nothing. */}
      <div
        role="group"
        aria-label="Chart time range"
        className="mt-4 flex flex-wrap gap-x-1 gap-y-1"
      >
        {RANGE_KEYS.map((k) => {
          const off = empty.has(k);
          const on = k === range;
          return (
            <button
              key={k}
              type="button"
              disabled={off}
              aria-pressed={on}
              title={off ? `No ${k} history is published for ${symbol}` : undefined}
              onClick={() => setRange(k)}
              className={`inline-flex min-h-11 items-center px-3 text-[0.62rem] uppercase tracking-[0.16em] transition-colors duration-200 ${
                off
                  ? "cursor-not-allowed text-stone-dim/40 line-through"
                  : on
                    ? "text-ink"
                    : "text-stone hover:text-paper"
              } ${on ? "bg-gold" : ""}`}
            >
              {k}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {state === "error" ? (
          <p className="border border-dashed border-paper/15 px-6 py-10 text-[0.85rem] text-paper-dim">
            This range could not be retrieved. Nothing is estimated in its
            place — pick another range, or try again.
          </p>
        ) : data && !data.available ? (
          <p className="border border-dashed border-paper/15 px-6 py-10 text-[0.85rem] text-paper-dim">
            No {range} history is published for {symbol}. The listing is
            likely younger than this window. Nothing is shown rather than a
            shorter series wearing this range&apos;s label.
          </p>
        ) : !geom ? (
          <p className="px-1 py-10 text-[0.85rem] text-stone">Loading price history…</p>
        ) : (
          <>
            {/* The readout sits above the chart so it never moves under
                the pointer, and is a live region so keyboard users hear
                the value as they step through observations. */}
            <p
              aria-live="polite"
              className="tabular min-h-6 text-[0.8rem] text-paper"
            >
              {readout ?? (
                <span className="text-stone-dim">
                  {observations} observations · hover or focus the chart to read a value
                </span>
              )}
            </p>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className={`mt-2 w-full touch-pan-y ${expanded ? "h-[60vh]" : "h-auto"} ${state === "loading" ? "opacity-50" : ""}`}
              role="img"
              tabIndex={0}
              onKeyDown={onKey}
              onMouseMove={(e) => pick(e.clientX)}
              onMouseLeave={() => setCursor(null)}
              onTouchStart={(e) => pick(e.touches[0].clientX)}
              onTouchMove={(e) => pick(e.touches[0].clientX)}
              aria-label={`${symbol} closing price over ${range}, from ${first ? stamp(first.t) : DASH} to ${last ? stamp(last.t) : DASH}. ${
                change === null
                  ? ""
                  : `${up ? "Up" : "Down"} ${Math.abs(change).toFixed(1)} per cent over the period.`
              } ${observations} observations. Use arrow keys to read individual values.`}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                const v = geom.lo + (geom.hi - geom.lo) * f;
                return (
                  <g key={f}>
                    <line
                      x1={PAD.left}
                      x2={W - PAD.right}
                      y1={geom.y(v)}
                      y2={geom.y(v)}
                      stroke="currentColor"
                      className="text-paper/[0.08]"
                      strokeWidth={1}
                    />
                    <text
                      x={W - PAD.right + 10}
                      y={geom.y(v) + 4}
                      className="fill-stone-dim text-[11px]"
                    >
                      {decimal(v, v >= 100 ? 0 : 2)}
                    </text>
                  </g>
                );
              })}

              {low !== null && low >= geom.lo && low <= geom.hi ? (
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={geom.y(low)}
                  y2={geom.y(low)}
                  className="text-ice/30"
                  stroke="currentColor"
                  strokeDasharray="3 4"
                />
              ) : null}
              {high !== null && high >= geom.lo && high <= geom.hi ? (
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={geom.y(high)}
                  y2={geom.y(high)}
                  className="text-gold/30"
                  stroke="currentColor"
                  strokeDasharray="3 4"
                />
              ) : null}

              <path
                d={geom.line}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className={up ? "text-gold" : "text-ice"}
              />

              {active && cursor !== null ? (
                <g>
                  <line
                    x1={geom.x(cursor)}
                    x2={geom.x(cursor)}
                    y1={PAD.top}
                    y2={H - PAD.bottom}
                    stroke="currentColor"
                    className="text-paper/30"
                    strokeWidth={1}
                  />
                  <circle
                    cx={geom.x(cursor)}
                    cy={geom.y(active.c)}
                    r={3.5}
                    className={up ? "fill-gold" : "fill-ice"}
                  />
                </g>
              ) : null}

              <text x={PAD.left} y={H - 8} className="fill-stone-dim text-[11px]">
                {first ? (intraday ? stamp(first.t) : axisMonth(first.t)) : ""}
              </text>
              <text
                x={W - PAD.right}
                y={H - 8}
                textAnchor="end"
                className="fill-stone-dim text-[11px]"
              >
                {last ? (intraday ? stamp(last.t) : axisMonth(last.t)) : ""}
              </text>
            </svg>

            <figcaption className="mt-3 text-[0.62rem] uppercase tracking-[0.16em] text-stone-dim">
              {observations} observed closes
              {observations > points.length ? `, ${points.length} plotted` : ""}
              {" · "}
              {/* The server-rendered first paint carries no spacing
                  figure, but it is always the company route's 1y/1d
                  series, so daily is a fact here rather than a guess. */}
              {spacingLabel(
                data ? data.observedSpacingDays : 1,
                intraday,
              )}
              {" · price only, excludes dividends · delayed, not real time"}
            </figcaption>
          </>
        )}
      </div>
    </figure>
  );
}
