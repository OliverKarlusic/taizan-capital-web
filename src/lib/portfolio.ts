/**
 * The five investment convictions shown in the circular gallery.
 *
 * No returns, no performance figures, no expected-outcome language. Nothing
 * here can be read as a promise, because no verified client performance
 * data exists yet.
 *
 * Imagery is drawn from Taizan's own licensed footage rather than sourced
 * separately — real frames from the mountain, forest and river masters the
 * visitor has just travelled through. The section becomes the journey's
 * index rather than a product grid, and nothing here is generated.
 */

export interface Conviction {
  slug: string;
  index: string;
  name: string;
  /** One line of philosophy. Never a claim about outcomes. */
  statement: string;
  /** What the mandate is, in one sentence. */
  purpose: string;
  image: string;
}

export const CONVICTIONS: Conviction[] = [
  {
    slug: "long-term-growth",
    index: "01",
    name: "Long-Term Growth",
    statement: "True wealth is built through time and ownership.",
    purpose:
      "A core equity strategy focused on owning exceptional businesses and allowing wealth to compound over decades.",
    // Mountain: foundations, patience, permanence.
    image: "/media/portfolio/01-long-term-growth.jpg",
  },
  {
    slug: "passive-income",
    index: "02",
    name: "Passive Income Portfolio",
    statement: "Ownership creates lasting income.",
    purpose:
      "A dividend-focused equity portfolio designed to provide reliable income while maintaining exposure to quality businesses.",
    // Mature forest: stability, consistency, steady yield.
    image: "/media/portfolio/02-passive-income.jpg",
  },
  {
    slug: "growth-maximisation",
    index: "03",
    name: "Growth Maximisation Portfolio",
    statement: "Growth requires conviction.",
    purpose:
      "A higher-growth strategy designed for investors seeking maximum capital appreciation and willing to accept greater volatility.",
    // Rising light on the ridge: expansion, forward movement.
    image: "/media/portfolio/03-growth-maximisation.jpg",
  },
  {
    slug: "satellite",
    index: "04",
    name: "Satellite Portfolio",
    statement: "A strong foundation allows room for exploration.",
    purpose:
      "A flexible allocation focused on targeted opportunities, emerging themes, and specialised investment ideas outside the core portfolio.",
    /* The brief asked for constellations and astronomy. There is no
       night-sky footage in the library and the rule is real imagery only,
       so this uses the aerial above the cloud layer instead — which
       delivers the other half of the brief directly: global perspective and
       strategic positioning, seen from above the weather. Swap for a
       licensed astronomy plate if the literal reading is wanted. */
    image: "/media/portfolio/04-satellite.jpg",
  },
  {
    slug: "impact",
    index: "05",
    name: "Impact Investing Portfolio",
    statement: "Capital can build a better future.",
    purpose:
      "A portfolio focused on investments that aim to create positive environmental and societal outcomes alongside financial objectives.",
    // Living water through forest: regeneration, ecosystems, continuity.
    image: "/media/portfolio/05-impact.jpg",
  },
];
