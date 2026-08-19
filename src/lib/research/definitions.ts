/**
 * What each metric means, written for someone who does not work in
 * finance.
 *
 * ── WHY THESE ARE WRITTEN THIS WAY ──────────────────────────────────
 * A definition that reads "the ratio of price to book value per share"
 * helps nobody who did not already know. Each entry below says what the
 * number measures, in a sentence a reader outside the industry can use,
 * and where a figure is easy to misread it says that too.
 *
 * ── AND WHAT THEY DELIBERATELY DO NOT SAY ───────────────────────────
 * None of them says whether a value is good. "A low P/E may indicate an
 * undervalued company" is a recommendation wearing a definition's
 * clothes, and this terminal does not publish those. They describe the
 * measure; what it means for a particular holding is the reader's to
 * decide.
 */

export interface Definition {
  /** One sentence: what the number measures. */
  what: string;
  /** Optional: the trap a reader can fall into with this figure. */
  caveat?: string;
}

export const DEFINITIONS: Record<string, Definition> = {
  /* ── price and size ── */
  price: {
    what: "The most recent traded price for one share, from the delayed feed.",
    caveat: "Delayed, so it is not the price you would trade at right now.",
  },
  change: {
    what: "How far the price has moved since the previous session's close, as a percentage.",
  },
  marketCap: {
    what: "What the whole company is worth at the current share price — price multiplied by the number of shares on issue.",
  },
  volume: {
    what: "How many shares changed hands during the session.",
  },
  fiftyTwoWeekRange: {
    what: "The lowest and highest price the share reached over the past year.",
  },

  /* ── valuation ── */
  trailingPE: {
    what: "The share price divided by the profit earned per share over the last twelve months. It says how many years of current profit you are paying for.",
    caveat:
      "Undefined when a company makes a loss, which is why it is often blank rather than zero.",
  },
  forwardPE: {
    what: "The same idea as P/E, but using the profit analysts expect next year rather than the profit already earned.",
    caveat: "Built on forecasts, which are opinions rather than results.",
  },
  priceToBook: {
    what: "The share price compared with the accounting value of the company's assets less its debts.",
    caveat:
      "Book value ignores things that do not appear on a balance sheet, such as a brand or a customer base.",
  },
  evToEbitda: {
    what: "The company's total value including its debt, compared with its earnings before interest, tax and depreciation.",
  },
  dividendYield: {
    what: "The dividend paid over the past year as a percentage of the current share price.",
    caveat: "A past dividend is not a promise of a future one.",
  },
  payoutRatio: {
    what: "The share of profit paid out to shareholders as dividends rather than kept in the business.",
  },

  /* ── profitability ── */
  grossMargin: {
    what: "What proportion of each dollar of sales is left after paying the direct cost of producing the goods or services.",
  },
  operatingMargin: {
    what: "What proportion of each dollar of sales is left after paying all the costs of running the business, but before interest and tax.",
  },
  netMargin: {
    what: "What proportion of each dollar of sales ends up as profit after every cost, including interest and tax.",
  },
  roe: {
    what: "Profit earned for each dollar shareholders have invested in the company.",
    caveat:
      "Borrowing more can raise this figure without the business becoming better at what it does.",
  },
  roa: {
    what: "Profit earned for each dollar of assets the company holds.",
  },
  roic: {
    what: "Profit earned for each dollar of capital put into the business, counting both borrowed money and shareholders' money, and after the tax the company actually paid.",
    caveat:
      "Calculated here using the effective tax rate the company reported, not an assumed rate.",
  },

  /* ── financial position ── */
  currentRatio: {
    what: "Whether the company holds enough short-term assets to cover the bills it must pay within a year.",
  },
  quickRatio: {
    what: "The same test as the current ratio, but excluding inventory, on the basis that stock cannot always be sold quickly.",
  },
  netDebtToEbitda: {
    what: "How many years of current earnings it would take to repay the company's debt, net of the cash it holds.",
  },
  debtToEquity: {
    what: "How much the company has borrowed for each dollar shareholders have put in.",
  },
  interestCoverage: {
    what: "How many times over the company's operating profit could pay the interest on its debt.",
  },

  /* ── cash ── */
  operatingCashFlow: {
    what: "Cash the business actually generated from trading, before spending on new assets.",
  },
  freeCashFlow: {
    what: "Cash left over after the business has paid for the equipment and investment needed to keep running.",
  },
  cashConversion: {
    what: "How much of the reported profit arrived as actual cash.",
    caveat:
      "Profit is an accounting measure; this compares it with money that genuinely moved.",
  },
  cashConversionCycle: {
    what: "How many days pass between paying for stock and collecting the cash from selling it.",
    caveat: "A negative figure means customers pay before suppliers are paid.",
  },

  /* ── risk ── */
  beta: {
    what: "How much the share tends to move when the wider market moves. Above one means it has historically moved more than the market.",
    caveat: "Measured on past prices, and past sensitivity need not persist.",
  },
  volatility: {
    what: "How much the price has bounced around over the past year, annualised.",
  },
  maxDrawdown: {
    what: "The largest fall from a peak to a subsequent low over the period shown.",
  },
  rangePosition: {
    what: "Where the current price sits between its lowest and highest point of the past year.",
  },

  /* ── funds ── */
  expenseRatio: {
    what: "The annual cost of holding the fund, as a percentage of the money invested.",
  },
  netAssets: {
    what: "The total value of everything the fund holds.",
  },
  nav: {
    what: "The value of one unit of the fund, based on what its holdings are worth.",
  },

  /* ── conventions used on screen ── */
  notMeaningful: {
    what: "Shown as N/M. The arithmetic produces a number, but that number would not mean anything — a price-to-earnings multiple on a company that made a loss, for example.",
  },
  unavailable: {
    what: "Shown as an em dash. The data source did not supply this figure. Nothing is estimated in its place.",
  },
};

/** Definition text as a single string, for a title attribute. */
export function definitionText(key: string): string | undefined {
  const d = DEFINITIONS[key];
  if (!d) return undefined;
  return d.caveat ? `${d.what}\n\n${d.caveat}` : d.what;
}
