"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Market snapshot — an interactive mandate performance card.
 *
 * Functionality is unchanged from the original: period tabs, pointer
 * scrubbing across the series, an animated price readout and a date stamp
 * under the cursor.
 *
 * Visually rebuilt for Taizan: charcoal surface, hairline rules, bronze
 * series line, serif numerals, uppercase micro-type. No gradients, no
 * rounded pills, no colour used as the only signal — the sign character
 * carries the direction of the change as well as the tone.
 *
 * Figures are illustrative, consistent with the rest of the site.
 */

const BRONZE = "#c6a664";
const HAIRLINE = "color-mix(in srgb, #f4f3ee 10%, transparent)";
const SURFACE = "#0e1012";

const PERIODS = ["1Y", "3Y", "5Y", "10Y", "All"] as const;
const VALUES = [
  100, 104.2, 108.9, 106.1, 112.4, 118.7, 116.2, 124.9, 131.5, 129.8, 138.2,
  146.9, 143.1, 153.6, 162.8, 159.4, 171.2, 182.5, 178.9, 191.7, 204.6, 213.4,
];
const W = 320;
const H = 150;

const WINDOW_YEARS: Record<string, number> = {
  "1Y": 1,
  "3Y": 3,
  "5Y": 5,
  "10Y": 10,
  All: 20,
};

export default function MarketSnapshotCard() {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [period, setPeriod] = useState<string>("All");
  const [hover, setHover] = useState<number | null>(null);

  const factor = Math.max(
    7,
    Math.round(
      VALUES.length * ((PERIODS.indexOf(period as never) + 1) / PERIODS.length),
    ),
  );
  const data = useMemo(() => VALUES.slice(-factor), [factor]);

  const min = Math.min(...data) * 0.97;
  const max = Math.max(...data) * 1.02;
  const x = (i: number) => 8 + (i / (data.length - 1)) * (W - 16);
  const y = (v: number) => 8 + (1 - (v - min) / (max - min || 1)) * (H - 18);
  const path = data
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");

  const active = hover == null ? data.length - 1 : hover;
  const value = data[active];
  const delta = value - data[0];
  const pct = (delta / data[0]) * 100;

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setHover(
      Math.max(
        0,
        Math.min(
          data.length - 1,
          Math.round(
            ((event.clientX - bounds.left) / bounds.width) * (data.length - 1),
          ),
        ),
      ),
    );
  };

  /** Year under the cursor, anchored so every render reads the same. */
  const hoverStamp = (i: number) => {
    const endYear = 2026;
    const back =
      ((data.length - 1 - i) / (data.length - 1)) * (WINDOW_YEARS[period] ?? 20);
    const d = new Date(endYear, 0, 1);
    d.setMonth(d.getMonth() - Math.round(back * 12));
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };

  return (
    <figure
      className="w-full max-w-[340px] overflow-hidden border border-paper/10"
      style={{ background: SURFACE }}
    >
      <figcaption className="flex items-start justify-between px-5 pb-3 pt-5">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
            Taizan Global Mandate
          </p>
          <div className="tabular mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value.toFixed(2)}
                className="font-serif text-[26px] leading-none text-paper"
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {value.toFixed(2)}
              </motion.span>
            </AnimatePresence>
            <span
              className="text-[11px] font-medium"
              style={{ color: delta >= 0 ? BRONZE : "#a8b0b8" }}
            >
              {delta >= 0 ? "+" : "−"}
              {Math.abs(delta).toFixed(2)} ({pct >= 0 ? "+" : "−"}
              {Math.abs(pct).toFixed(2)}%)
            </span>
          </div>
        </div>
        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">
          Growth of 100
        </span>
      </figcaption>

      <div className="relative px-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Taizan Global Mandate, growth of 100 to ${value.toFixed(2)} over ${period}`}
        >
          {[0.33, 0.66].map((p) => (
            <line
              key={p}
              x1="8"
              x2={W - 8}
              y1={8 + p * (H - 18)}
              y2={8 + p * (H - 18)}
              stroke={HAIRLINE}
            />
          ))}
          <motion.path
            key={period}
            d={path}
            fill="none"
            stroke={BRONZE}
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          {hover != null && (
            <>
              <line
                x1={x(active)}
                x2={x(active)}
                y1="8"
                y2={H - 10}
                stroke="color-mix(in srgb, #f4f3ee 22%, transparent)"
              />
              <circle
                cx={x(active)}
                cy={y(value)}
                r="3"
                fill={BRONZE}
                stroke={SURFACE}
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>
        {hover != null && (
          <div
            className="tabular pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap border px-2 py-0.5 text-[9px] uppercase tracking-[0.1em]"
            style={{
              left: `${((x(active) / W) * 100).toFixed(1)}%`,
              background: "#0a0a0a",
              borderColor: "color-mix(in srgb, #c6a664 40%, transparent)",
              color: "#c6cacd",
            }}
            role="status"
          >
            {hoverStamp(active)}
          </div>
        )}
      </div>

      <div className="border-t border-paper/10 px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-1">
          {PERIODS.map((item) => {
            const isActive = item === period;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setPeriod(item);
                  setHover(null);
                }}
                className="relative px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] transition-colors duration-300"
                style={{ color: isActive ? "#f4f3ee" : "#a8b0b8" }}
              >
                {item}
                {isActive && (
                  <motion.span
                    layoutId="msnap-period-tab"
                    className="absolute inset-x-1.5 -bottom-[5px] h-px"
                    style={{ background: BRONZE }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 34,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-stone-dim">
          <span>Illustrative — not actual performance</span>
          <span>Net of fees</span>
        </div>
      </div>
    </figure>
  );
}

export function Demo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-4">
      <MarketSnapshotCard />
    </div>
  );
}

export { MarketSnapshotCard as Component };
