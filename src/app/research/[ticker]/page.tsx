import type { Metadata } from "next";
import CompanyClient from "@/components/research/CompanyClient";

/**
 * A company's research page, inside the Terminal.
 *
 * Rendered on the client from the API route rather than server-fetched,
 * so the page shell and the Terminal chrome paint immediately and a slow
 * upstream cannot block the route back out. The reader is never stranded
 * on a blank screen waiting for a third-party feed.
 *
 * Not statically generated: these are live quotes, and a prerendered
 * price is a wrong price.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const symbol = decodeURIComponent(ticker).toUpperCase();
  return {
    title: `${symbol} — Research Terminal — Taizan Capital`,
    description: `Market data, valuation multiples, growth, profitability and objective risk measures for ${symbol}. No ratings or recommendations.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  return <CompanyClient symbol={decodeURIComponent(ticker).toUpperCase()} />;
}
