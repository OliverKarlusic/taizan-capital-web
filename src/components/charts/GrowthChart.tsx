"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartFrame, { DarkTooltip } from "./ChartFrame";
import { chart } from "./theme";

/** Illustrative growth of an initial allocation, disciplined vs. reactive. */
const data = (() => {
  const rows: { year: string; taizan: number; market: number }[] = [];
  let t = 100;
  let m = 100;
  const taizanReturns = [
    7.8, 8.9, 9.4, -4.2, 11.6, 8.1, 7.2, 9.8, 10.4, 6.9, -2.1, 12.3, 8.8, 7.5,
    -6.4, 13.1, 9.2, 8.4, 7.9, 9.6,
  ];
  const marketReturns = [
    9.2, 12.4, 5.1, -37.0, 26.5, 15.1, 2.1, 16.0, 3.2, 13.7, -11.9, 21.8, -4.4,
    18.4, -18.1, 26.3, -8.2, 24.2, 11.0, 6.1,
  ];
  for (let i = 0; i < 20; i++) {
    t *= 1 + taizanReturns[i] / 100;
    m *= 1 + marketReturns[i] / 100;
    rows.push({
      year: String(2006 + i),
      taizan: Math.round(t),
      market: Math.round(m),
    });
  }
  return rows;
})();

export default function GrowthChart() {
  return (
    <ChartFrame
      title="The Arithmetic of Patience"
      subtitle="Growth of 100, disciplined mandate vs. broad market — 20 years"
      legend={[
        { label: "Taizan mandate", color: chart.series1 },
        { label: "Broad market", color: chart.series2 },
      ]}
      note="Illustrative simulation for design purposes only. Not actual performance, not investment advice."
    >
      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={chart.axis}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={chart.axis}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              content={<DarkTooltip />}
              cursor={{ stroke: "rgba(198,166,100,0.35)", strokeWidth: 1 }}
            />
            <Line
              name="Taizan mandate"
              type="monotone"
              dataKey="taizan"
              stroke={chart.series1}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: chart.series1, strokeWidth: 0 }}
            />
            <Line
              name="Broad market"
              type="monotone"
              dataKey="market"
              stroke={chart.series2}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: chart.series2, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
