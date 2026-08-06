"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  Cell,
} from "recharts";
import ChartFrame, { DarkTooltip } from "./ChartFrame";
import { chart } from "./theme";

/** Representative multi-asset allocation (magnitude → single-hue bars). */
const data = [
  { name: "Global Equities", value: 32 },
  { name: "Investment-Grade Credit", value: 24 },
  { name: "Sovereign Bonds", value: 14 },
  { name: "Real Assets", value: 12 },
  { name: "Private Markets", value: 10 },
  { name: "Gold & Commodities", value: 5 },
  { name: "Cash & Equivalents", value: 3 },
];

/* Single-hue lightness steps of the gold ramp — magnitude, not identity. */
const ramp = [
  "#c8a548",
  "#bd9a3e",
  "#b18f36",
  "#a2822f",
  "#937629",
  "#836923",
  "#745d1f",
];

export default function AllocationChart() {
  return (
    <ChartFrame
      title="Strategic Allocation"
      subtitle="Representative multi-asset mandate, % of portfolio"
      note="Illustrative allocation for design purposes only. Actual mandates are constructed per client objectives and constraints."
    >
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 44, bottom: 0, left: 8 }}
            barCategoryGap={9}
          >
            <XAxis type="number" hide domain={[0, 36]} />
            <YAxis
              type="category"
              dataKey="name"
              width={170}
              tick={{ ...chart.axis, fill: chart.textSecondary }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<DarkTooltip formatter={(v) => `${v}%`} />}
              cursor={{ fill: "rgba(244,243,238,0.04)" }}
            />
            <Bar
              name="Allocation"
              dataKey="value"
              barSize={14}
              radius={[0, 4, 4, 0]}
              isAnimationActive
            >
              {data.map((_, i) => (
                <Cell key={i} fill={ramp[i]} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v) => `${v}%`}
                style={{
                  fill: chart.textPrimary,
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  );
}
