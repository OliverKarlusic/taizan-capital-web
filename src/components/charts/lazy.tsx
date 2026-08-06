"use client";

import dynamic from "next/dynamic";

/**
 * Recharts is a large dependency and every chart sits well below the fold,
 * so the charts are split out of the initial bundle and fetched as the
 * visitor descends. Each placeholder reserves the finished chart's height so
 * nothing shifts when the real component arrives.
 */
function Placeholder({ height }: { height: number }) {
  return (
    <div
      className="border border-paper/8 bg-ink-soft"
      style={{ height }}
      aria-hidden="true"
    />
  );
}

export const AllocationChart = dynamic(() => import("./AllocationChart"), {
  ssr: false,
  loading: () => <Placeholder height={472} />,
});

export const GrowthChart = dynamic(() => import("./GrowthChart"), {
  ssr: false,
  loading: () => <Placeholder height={456} />,
});

export const DrawdownChart = dynamic(() => import("./DrawdownChart"), {
  ssr: false,
  loading: () => <Placeholder height={472} />,
});

export const CycleChart = dynamic(() => import("./CycleChart"), {
  ssr: false,
  loading: () => <Placeholder height={432} />,
});
