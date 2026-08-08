/**
 * The five investment strategies — card copy and full detail content.
 *
 * One source of truth for both the circular gallery and the detail pages,
 * so a strategy cannot say one thing on its card and another on its page.
 *
 * ── On the numbers ──────────────────────────────────────────────────
 * Every figure in `keyInfo` is a placeholder. Nothing here is a return, a
 * fee, a yield or a minimum that anyone has agreed to. They are typed as
 * strings precisely so "Coming soon" and "2.4%" are the same shape — when
 * real, verified figures exist, they replace the placeholder and nothing
 * else changes.
 *
 * Do not populate these from estimates, targets, or backtests. A number on
 * an asset manager's site is read as a commitment.
 */

export type RiskLevel = "Moderate" | "Moderate to high" | "High";

export interface KeyInfoRow {
  label: string;
  /** Real value, or an honest placeholder. Never an estimate. */
  value: string;
  /** Shown when the value is not yet a real figure. */
  pending?: boolean;
}

export interface Conviction {
  slug: string;
  index: string;
  name: string;
  /** One line of philosophy, used on the card. */
  statement: string;
  /** One sentence, used on the card beneath the statement. */
  purpose: string;
  image: string;

  /* ── detail page ── */
  objective: string;
  philosophy: string;
  approach: string[];
  riskLevel: RiskLevel;
  /** What the risk actually consists of — never just a label. */
  riskNarrative: string;
  riskFactors: { name: string; body: string }[];
  horizon: string;
  horizonNote: string;
  universe: string;
  suitability: string;
  keyInfo: KeyInfoRow[];
}

/** Risk factors common to every long-only equity strategy. */
const EQUITY_RISK = [
  {
    name: "Equity market risk",
    body: "Listed equity prices move with market sentiment, interest rates and economic conditions. Broad market declines affect quality businesses and poor ones alike, and no amount of company-level work prevents that.",
  },
  {
    name: "Business risk",
    body: "A company's competitive position, management decisions or end markets can deteriorate. Our assessment of a business can simply be wrong, or right at the time and wrong later.",
  },
  {
    name: "Valuation risk",
    body: "We estimate what a business is worth. That estimate carries error. Paying a price that assumes too much leaves no margin for the estimate being optimistic.",
  },
  {
    name: "Capital loss",
    body: "Investors can lose money, including amounts materially below what was contributed. Nothing in the strategy prevents this and it is not insured against.",
  },
];

const PENDING = (label: string): KeyInfoRow => ({
  label,
  value: "Coming soon",
  pending: true,
});

export const CONVICTIONS: Conviction[] = [
  /* ─────────────────────────────────────────────────────────────── 01 */
  {
    slug: "long-term-growth",
    index: "01",
    name: "Long-Term Growth",
    statement: "True wealth is built through time and ownership.",
    purpose:
      "A core equity strategy focused on owning exceptional businesses and allowing wealth to compound over decades.",
    image: "/media/portfolio/01-long-term-growth.jpg",
    objective:
      "To grow capital over long periods by owning a concentrated group of high-quality listed businesses, bought at prices that leave room for our assessment to be imperfect.",
    philosophy:
      "This is the core strategy and the clearest expression of how Taizan Capital invests. A business is worth the cash it can produce over its remaining life. Where we can understand that cash, judge its durability, and buy the business for less than our estimate, time does the rest. Turnover is treated as a cost rather than a sign of activity.",
    approach: [
      "Businesses with a demonstrable competitive advantage — something that explains why returns on capital persist rather than erode.",
      "Earnings that convert reliably to cash, and a balance sheet that would survive a period of difficulty without forced decisions.",
      "Management whose capital allocation record can be examined over a full cycle, not a favourable stretch of one.",
      "A purchase price below our assessment of value, wide enough to absorb the possibility that the assessment is wrong.",
    ],
    riskLevel: "Moderate to high",
    riskNarrative:
      "This strategy holds listed equities and is fully exposed to equity market movement. Concentration is deliberate — fewer businesses, understood more deeply — which raises the impact of any single holding being wrong. Capital preservation is the first priority, but it is a discipline, not a guarantee.",
    riskFactors: [
      ...EQUITY_RISK,
      {
        name: "Concentration risk",
        body: "Holding fewer businesses means each one matters more. A single significant error affects the portfolio more than it would in a widely diversified strategy.",
      },
    ],
    horizon: "Seven years or longer",
    horizonNote:
      "The strategy assumes an investor who will not need the capital during a market decline. Shorter horizons expose the investor to the market's timing rather than the businesses' progress.",
    universe:
      "Long-only listed equities across the ASX, NYSE and Nasdaq. No short selling, no derivatives, no leverage.",
    suitability:
      "Investors seeking long-term capital growth who accept equity volatility and do not require access to the capital in the near term.",
    keyInfo: [
      PENDING("Performance"),
      PENDING("Management fee"),
      PENDING("Minimum investment"),
      { label: "Risk level", value: "Moderate to high" },
      { label: "Investment horizon", value: "7+ years" },
      { label: "Distributions", value: "Not an income strategy" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────── 02 */
  {
    slug: "passive-income",
    index: "02",
    name: "Passive Income",
    statement: "Ownership creates lasting income.",
    purpose:
      "A dividend-focused equity portfolio designed to provide reliable income while maintaining exposure to quality businesses.",
    image: "/media/portfolio/02-passive-income.jpg",
    objective:
      "To generate recurring income from a portfolio of dividend-paying listed equities, while preserving the capital that produces it.",
    philosophy:
      "A dividend is an outcome, not a feature. It is paid out of cash the business actually generated, and it continues only while the business continues to generate it. We assess the durability of the payment before the size of it — a high yield is frequently the market pricing in a cut that has not been announced yet.",
    approach: [
      "Payout ratios examined against free cash flow rather than reported earnings, which can support a dividend the business cannot.",
      "Balance-sheet capacity to maintain distributions through a weak year without borrowing to do so.",
      "A distribution record observed across a full cycle, including what the business did in its worst period.",
      "Yield considered last. A sustainable moderate yield is preferred to a high one that reflects a falling share price.",
    ],
    riskLevel: "Moderate",
    riskNarrative:
      "Income strategies are sometimes presented as low risk. They are not. The capital remains fully exposed to equity markets, and dividends are discretionary — a company can reduce or suspend them at any time, usually when conditions are already difficult and the investor is least able to absorb it.",
    riskFactors: [
      ...EQUITY_RISK,
      {
        name: "Distribution risk",
        body: "Dividends are declared at the discretion of each company's board. They can be cut, deferred or withdrawn without notice, and income received in one period is not an indication of income in the next.",
      },
      {
        name: "Sector concentration",
        body: "Dividend-paying businesses cluster in particular sectors. A portfolio built on yield can become concentrated in those sectors without that being an intentional decision.",
      },
    ],
    horizon: "Five years or longer",
    horizonNote:
      "Income can be drawn earlier, but the capital producing it still requires time to withstand equity market cycles.",
    universe:
      "Long-only listed equities across the ASX, NYSE and Nasdaq, weighted toward established dividend-paying businesses.",
    suitability:
      "Investors seeking recurring income who understand that both the income and the capital may fall.",
    keyInfo: [
      PENDING("Performance"),
      PENDING("Distribution yield"),
      PENDING("Management fee"),
      PENDING("Minimum investment"),
      { label: "Risk level", value: "Moderate" },
      { label: "Investment horizon", value: "5+ years" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────── 03 */
  {
    slug: "growth-maximisation",
    index: "03",
    name: "Growth Maximisation",
    statement: "Growth requires conviction.",
    purpose:
      "A higher-growth strategy for investors seeking maximum capital appreciation and willing to accept greater volatility.",
    image: "/media/portfolio/03-growth-maximisation.jpg",
    objective:
      "To pursue higher long-term capital appreciation by owning businesses with stronger growth characteristics, accepting materially greater volatility and a wider range of outcomes in exchange.",
    philosophy:
      "The same method applies here as everywhere else at Taizan Capital — understand the business, estimate its value, buy below it. What changes is the shape of the outcome. Faster-growing businesses carry more of their value in expectations about the future, so the market reprices them harder in both directions. We are prepared to be wrong more often here, and we size positions accordingly.",
    approach: [
      "Businesses growing revenue and earnings well above the market, where the growth is explained by something durable rather than a favourable moment.",
      "Reinvestment opportunity — whether the business can deploy additional capital at attractive rates rather than simply growing larger.",
      "Explicit acknowledgement of what is already priced in. A superb business at an unforgiving price is not an investment.",
      "Smaller individual position sizes than the core strategy, because the dispersion of outcomes is wider.",
    ],
    riskLevel: "High",
    riskNarrative:
      "This is the highest-risk strategy Taizan Capital offers and it is not suitable for every investor. Higher-growth equities fall further and faster than the broad market in a downturn, and declines of a third or more from peak are a normal feature of this kind of portfolio rather than a failure of it. An investor who would sell during such a decline should not be in this strategy.",
    riskFactors: [
      ...EQUITY_RISK,
      {
        name: "Volatility",
        body: "Expect larger and more frequent drawdowns than the core strategy. The path is materially rougher even where the destination is better, and the two are not separable.",
      },
      {
        name: "Expectation risk",
        body: "Where a valuation depends on growth continuing, a slowdown that would be unremarkable elsewhere can cause a severe repricing.",
      },
      {
        name: "Liquidity",
        body: "Some growth businesses are smaller and trade less heavily, which can widen spreads and make positions slower to adjust in stressed conditions.",
      },
    ],
    horizon: "Ten years or longer",
    horizonNote:
      "The longest horizon of any Taizan strategy. Volatility of this magnitude requires time to be a rational thing to accept.",
    universe:
      "Long-only listed equities across the ASX, NYSE and Nasdaq, weighted toward higher-growth businesses. Still no short selling, derivatives or leverage.",
    suitability:
      "Investors with a high tolerance for volatility, a long horizon, and no foreseeable need to draw on the capital. Not suitable for investors seeking income, stability, or protection of capital over short periods.",
    keyInfo: [
      PENDING("Performance"),
      PENDING("Management fee"),
      PENDING("Minimum investment"),
      { label: "Risk level", value: "High" },
      { label: "Investment horizon", value: "10+ years" },
      { label: "Distributions", value: "Not an income strategy" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────── 04 */
  {
    slug: "satellite",
    index: "04",
    name: "Satellite Portfolio",
    statement: "A strong foundation allows room for exploration.",
    purpose:
      "A flexible allocation focused on targeted opportunities and specialised ideas outside the core portfolio.",
    image: "/media/portfolio/04-satellite.jpg",
    objective:
      "To hold a small number of selective positions that complement a core holding — specific situations or themes that do not fit the core mandate but are worth owning on their own merits.",
    philosophy:
      "A satellite allocation is a discipline, not a licence. It exists so that a good idea outside the core mandate has somewhere to go, rather than distorting the core to accommodate it. Every position is assessed on the same basis as any other: what the business is worth, and what is being asked for it. The flexibility is in the mandate, not in the standard.",
    approach: [
      "Situations the core mandate would exclude for reasons of size, sector or timing — but which meet the same test of business quality and price.",
      "Deliberate position limits, so a satellite holding cannot come to dominate the outcome of an overall allocation.",
      "Held as a complement to a core strategy rather than on its own. The satellite is sized against the core, not against enthusiasm.",
      "Sold when the reason for owning it resolves. These are positions with a stated thesis, not permanent holdings.",
    ],
    riskLevel: "Moderate to high",
    riskNarrative:
      "Positions here are less conventional than the core and are often smaller businesses or more specific situations, which raises both business risk and liquidity risk. This is not a speculative allocation and it is not run as one — but it is a concentrated set of individual judgements, and individual judgements are the thing most likely to be wrong.",
    riskFactors: [
      ...EQUITY_RISK,
      {
        name: "Concentration risk",
        body: "A small number of positions, each with a specific thesis. An error is not diluted by breadth.",
      },
      {
        name: "Liquidity",
        body: "Smaller or more specialised holdings can be slower and more costly to exit, particularly in stressed markets when exiting is most likely to be desired.",
      },
      {
        name: "Thesis risk",
        body: "Each position depends on a specific expectation. Where that expectation does not eventuate, the reason for holding disappears even if the business itself is unharmed.",
      },
    ],
    horizon: "Three to seven years",
    horizonNote:
      "Shorter than the core strategies, because satellite positions are held against a thesis with a resolution rather than indefinitely.",
    universe:
      "Long-only listed equities across the ASX, NYSE and Nasdaq. Intended to sit alongside a core holding rather than replace one.",
    suitability:
      "Investors who already hold a core allocation and want measured exposure to selective opportunities beyond it.",
    keyInfo: [
      PENDING("Performance"),
      PENDING("Management fee"),
      PENDING("Minimum investment"),
      { label: "Risk level", value: "Moderate to high" },
      { label: "Investment horizon", value: "3–7 years" },
      { label: "Intended use", value: "Complement to a core holding" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────── 05 */
  {
    slug: "impact-investing",
    index: "05",
    name: "Impact Investing",
    statement: "Capital can build a better future.",
    purpose:
      "A portfolio of businesses whose products or operations contribute to positive environmental and societal outcomes.",
    image: "/media/portfolio/05-impact.jpg",
    objective:
      "To invest in listed businesses that meet Taizan Capital's standard for financial quality and whose activity contributes measurably to environmental or societal outcomes — without treating the second as a reason to relax the first.",
    philosophy:
      "Impact and return are assessed separately and both must hold. A business that does good work but cannot fund itself is not an investment, and a profitable business is not an impact holding because its marketing says so. We look at what a company actually does — what it sells, how it operates — rather than at disclosure scores, which measure reporting quality more than conduct.",
    approach: [
      "Impact assessed at the level of the product or operation: what the business does, and whether the outcome would exist without it.",
      "The same financial standard as every other Taizan strategy — quality, cash generation, balance sheet, price.",
      "Third-party ratings treated as an input, not a conclusion. They frequently measure disclosure rather than behaviour.",
      "Exclusion used sparingly and stated plainly, rather than a broad screen presented as a philosophy.",
    ],
    riskLevel: "Moderate to high",
    riskNarrative:
      "Applying a second criterion narrows the available universe, and a narrower universe is a more concentrated one. Some businesses in this area also depend on policy support or subsidy, which can be withdrawn. The strategy carries the same equity market risk as every other, with those additional exposures on top.",
    riskFactors: [
      ...EQUITY_RISK,
      {
        name: "Universe constraint",
        body: "Applying impact criteria reduces the set of eligible businesses, which concentrates the portfolio into fewer names and sectors than an unconstrained mandate.",
      },
      {
        name: "Policy and regulatory risk",
        body: "Some activities in this area rely on regulation, subsidy or procurement. Changes in policy can affect the economics of an otherwise sound business.",
      },
      {
        name: "Measurement risk",
        body: "Impact is harder to verify than financial performance. Reported outcomes rely in part on company disclosure, which varies in quality and is not uniformly audited.",
      },
    ],
    horizon: "Seven years or longer",
    horizonNote:
      "Structural change is slow, and the businesses that benefit from it compound over similar periods rather than in a single cycle.",
    universe:
      "Long-only listed equities across the ASX, NYSE and Nasdaq, screened on both financial quality and the nature of the underlying activity.",
    suitability:
      "Investors who want their capital directed toward particular outcomes and accept a narrower, more concentrated universe as the cost of that.",
    keyInfo: [
      PENDING("Performance"),
      PENDING("Management fee"),
      PENDING("Minimum investment"),
      { label: "Risk level", value: "Moderate to high" },
      { label: "Investment horizon", value: "7+ years" },
      { label: "Screening", value: "Financial quality and activity" },
    ],
  },
];

export const CONVICTION_BY_SLUG = Object.fromEntries(
  CONVICTIONS.map((c) => [c.slug, c]),
) as Record<string, Conviction>;
