import { NextResponse } from "next/server";
import { searchSecurities } from "@/lib/research/security";

/**
 * Free-text security lookup across the provider's full coverage.
 *
 * This is what makes the terminal's universe the provider's universe
 * rather than a list this application maintains. Any equity or ETF on the
 * covered venues is reachable by name or ticker, including small and
 * micro caps that no index list would contain.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 64);

  if (q.trim().length < 2) {
    return NextResponse.json({
      query: q,
      results: [],
      filtered: { offMarket: 0, secondaryVenue: 0, nonResearchableType: 0 },
      retrievedAt: new Date().toISOString(),
      note: "Enter at least two characters.",
    });
  }

  try {
    return NextResponse.json(await searchSecurities(q));
  } catch {
    return NextResponse.json(
      {
        error:
          "Security search is unavailable right now. No results are shown rather than guessed ones.",
      },
      { status: 502 },
    );
  }
}
