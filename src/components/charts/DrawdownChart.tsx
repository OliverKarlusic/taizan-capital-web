"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartFrame, { DarkTooltip } from "./ChartFrame";
import { chart } from "./theme";

/** Capital preservation through major stress events (illustrative). */
const data = [
  { event: "'08 Crisis", taizan: -16, market: -51 },
  { event: "'11 Euro", taizan: -7, market: -19 },
  { event: "'15 China", taizan: -5, market: -12 },
  { event: "'18 Q4", taizan: -8, market: -20 },
  { event: "'20 Pandemic", taizan: -11, market: -34 },
  { event: "'22 Rates", taizan: -9, market: -25 },
];

export default function DrawdownChart() {
  return (
    <ChartFrame
      title="Preservation Under Stress"
      subtitle="Peak-to-trough drawdown through major market events, %"
      legend={[
        { label: "Taizan mandate", color: chart.series1 },
        { label: "Broad market", color: chart.series2 },
      ]}
      note="Illustrative simulation for design purposes only. Losses are shown as negative values; shallower bars indicate better capital preservation."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            barCategoryGap="28%"
            barGap={2}
          >
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="event"
              tick={chart.axis}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={chart.axis}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              content={<DarkTooltip formatter={(v) => `${v}%`} />}
              cursor={{ fill: "rgba(244,243,238,0.04)" }}
            />
            <Bar
              name="Taizan mandate"
              dataKey="taizan"
              fill={chart.series1}
              barSize={14}
              radius={[0, 0, 4, 4]}
            />
            <Bar
              name="Broad market"
              dataKey="market"
              fill={chart.series2}
              barSize={14}
              radius={[0, 0, 4, 4]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
