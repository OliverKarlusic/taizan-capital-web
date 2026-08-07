/**
 * The five investment convictions.
 *
 * No returns, no performance figures, no expected-outcome language. Nothing
 * here can be read as a promise, because no verified client performance
 * data exists yet. When it does, it belongs in its own section with its own
 * disclosures — not on a philosophy card.
 *
 * Imagery is drawn from Taizan's own licensed footage rather than sourced
 * separately. Each card is a still from the film the visitor has just
 * travelled through, so the section reads as the journey's index rather
 * than a product grid — and nothing here is generated.
 */

export interface Conviction {
  slug: string;
  /** Two-digit chapter number, matching the film's numbering. */
  index: string;
  name: string;
  /** The single line the card must communicate. */
  message: string;
  /** What the mandate is, in one sentence. Never a claim about outcomes. */
  purpose: string;
  /** Four words. The philosophy, stated plainly. */
  principles: [string, string, string, string];
  /** Real image under /public, or null while unsourced. */
  image: string | null;
  /** What real photography this slot needs, if it has none. */
  imageBrief: string | null;
}

export const CONVICTIONS: Conviction[] = [
  {
    slug: "long-term-growth",
    index: "01",
    name: "Long-Term Growth",
    message: "True wealth is built through time and ownership.",
    purpose:
      "Long-term ownership of exceptional businesses and assets, held through cycles rather than traded across them.",
    principles: ["Patience", "Compounding", "Quality", "Longevity"],
    image: "/media/portfolio/01-long-term-growth.jpg",
    imageBrief: null,
  },
  {
    slug: "dividend-income",
    index: "02",
    name: "Dividend Income",
    message: "Ownership creates lasting income.",
    purpose:
      "Sustainable income through ownership of quality dividend-paying equities, selected for the durability of the business behind the payment.",
    principles: ["Consistency", "Reliability", "Independence", "Endurance"],
    image: "/media/portfolio/02-dividend-income.jpg",
    imageBrief: null,
  },
  {
    slug: "growth-maximisation",
    index: "03",
    name: "Growth Maximisation",
    message: "Growth requires conviction.",
    purpose:
      "A higher-growth mandate for investors who accept greater volatility in pursuit of long-term capital appreciation.",
    principles: ["Innovation", "Opportunity", "Ambition", "Judgement"],
    // The one card the film cannot supply. Nothing in the mountain, forest
    // or river material speaks to innovation or emerging industry, and a
    // mismatched still would be worse than none.
    image: null,
    imageBrief:
      "Real photography of precision manufacturing, research instrumentation or advanced infrastructure. Architectural framing, cool restrained light, no people, no screens, no abstract 'tech' graphics. Landscape, 1440x1080 or larger.",
  },
  {
    slug: "satellite",
    index: "04",
    name: "Satellite",
    message: "A strong foundation allows room for exploration.",
    purpose:
      "A flexible mandate that complements core holdings through selective, thematic opportunities beyond them.",
    principles: ["Adaptability", "Precision", "Perspective", "Selectivity"],
    image: "/media/portfolio/04-satellite.jpg",
    imageBrief: null,
  },
  {
    slug: "impact",
    index: "05",
    name: "Impact",
    message: "Capital can build a better future.",
    purpose:
      "Investment in companies creating measurable environmental and social outcomes alongside financial ones.",
    principles: ["Sustainability", "Responsibility", "Stewardship", "Purpose"],
    image: "/media/portfolio/05-impact.jpg",
    imageBrief: null,
  },
];
