import ScreenerClient from "@/components/research/ScreenerClient";

/**
 * The Screener — the Terminal's entry point.
 *
 * The heading block is deliberately three lines and then out of the way.
 * On a marketing page this would open with a full-height statement; here
 * the reader came to filter a list, and the list should be near the top
 * of the fold.
 */

export default function ResearchPage() {
  return (
    <>
      <section className="mx-auto max-w-[110rem] px-6 pb-6 pt-10 lg:px-10">
        <h1 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-tight text-paper">
          Market Screener
        </h1>
        <p className="mt-3 max-w-[76ch] text-[0.85rem] font-light leading-[1.85] text-paper-dim">
          Listed equities across the ASX, NYSE and Nasdaq — the markets
          Taizan Capital invests in. Filter and sort on delayed market data,
          then open a company for its full research record. Prices are not
          real time. No ratings, scores or recommendations are published
          anywhere in this terminal.
        </p>
      </section>
      <ScreenerClient />
    </>
  );
}
