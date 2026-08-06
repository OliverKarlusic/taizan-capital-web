"use client";

import type { ReactNode } from "react";
import type { LegendItem } from "./theme";

interface ChartFrameProps {
  title: string;
  subtitle?: string;
  legend?: LegendItem[];
  note?: string;
  children: ReactNode;
}

/** Shared chart chrome: title block, legend row, illustrative-data note. */
export default function ChartFrame({
  title,
  subtitle,
  legend,
  note,
  children,
}: ChartFrameProps) {
  return (
    <figure className="border border-paper/8 bg-ink-soft p-6 sm:p-8">
      <figcaption className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl text-paper">{title}</h3>
          {subtitle ? (
            <p className="mt-1 text-xs tracking-wide text-stone">{subtitle}</p>
          ) : null}
        </div>
        {legend && legend.length > 1 ? (
          <ul className="flex items-center gap-5">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: l.color }}
                />
                <span className="text-[0.68rem] uppercase tracking-[0.14em] text-stone">
                  {l.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </figcaption>
      {children}
      {note ? (
        <p className="mt-5 text-[0.65rem] leading-relaxed tracking-wide text-stone-dim">
          {note}
        </p>
      ) : null}
    </figure>
  );
}

interface TooltipPayloadEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
}

export function DarkTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-gold/25 bg-ink/95 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
      <p className="mb-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-stone">
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-sm text-paper">
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-stone">{entry.name}</span>
          <span className="tabular font-medium">
            {formatter && typeof entry.value === "number"
              ? formatter(entry.value)
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}
