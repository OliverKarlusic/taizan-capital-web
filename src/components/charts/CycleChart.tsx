"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import ChartFrame, { DarkTooltip } from "./ChartFrame";
import { chart } from "./theme";

/** The market cycle — sentiment oscillates, discipline holds the line. */
const data = Array.from({ length: 48 }, (_, i) => {
  const t = i / 47;
  const cycle =
    Math.sin(t * Math.PI * 3.2 - 0.8) * 28 +
    Math.sin(t * Math.PI * 7.1) * 7 +
    t * 10;
  return {
    q: `Q${(i % 4) + 1} '${String(14 + Math.floor(i / 4)).padStart(2, "0")}`,
    sentiment: Math.round(cycle),
  };
});

export default function CycleChart() {
  return (
    <ChartFrame
      title="Cycles Are Weather. Discipline Is Climate."
      subtitle="Composite market-sentiment oscillator across three full cycles"
      note="Illustrative composite for design purposes only. The zero line marks neutral positioning — where disciplined mandates spend most of their time."
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chart.series1} stopOpacity={0.32} />
                <stop offset="100%" stopColor={chart.series1} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="q"
              tick={chart.axis}
              tickLine={false}
              axisLine={false}
              interval={11}
            />
            <YAxis tick={chart.axis} tickLine={false} axisLine={false} />
            <ReferenceLine y={0} stroke="rgba(244,243,238,0.18)" strokeDasharray="4 4" />
            <Tooltip
              content={<DarkTooltip />}
              cursor={{ stroke: "rgba(198,166,100,0.35)", strokeWidth: 1 }}
            />
            <Area
              name="Sentiment"
              type="monotone"
              dataKey="sentiment"
              stroke={chart.series1}
              strokeWidth={2}
              fill="url(#cycleFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
