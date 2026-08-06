/**
 * Portfolio holdings shown in the circular gallery.
 *
 * These are investment *themes*, not named public companies. Attaching an
 * invented annual return to a real, identifiable company would be fabricated
 * financial data about a real entity — the one thing a firm like this can
 * never ship, even in a design concept. Themes carry the same institutional
 * weight without that problem. Swap in real holdings once real, sourced
 * figures exist.
 *
 * Images follow the same rule as the hero footage: real licensed photography
 * only. A holding with `image: null` renders a sourcing frame naming the
 * shot it needs — never generated artwork.
 */

export interface Holding {
  slug: string;
  /** Theme or holding name. */
  company: string;
  category:
    | "Technology"
    | "Healthcare"
    | "Infrastructure"
    | "Global Equity"
    | "Real Assets"
    | "Private Markets";
  /** Real licensed photography under /public, or null while unsourced. */
  image: string | null;
  /** One line of investment reasoning. */
  description: string;
  /** Annualised return, illustrative. */
  performance: string;
  /** Portfolio weighting, illustrative. */
  allocation: string;
  /** What real photograph this slot requires. */
  imageBrief: string;
}

export const HOLDINGS: Holding[] = [
  {
    slug: "precision-manufacturing",
    company: "Precision Manufacturing",
    category: "Technology",
    image: null,
    description:
      "Machine-tool and robotics businesses with decades-long customer relationships and pricing power that survives the cycle.",
    performance: "+11.4% p.a.",
    allocation: "14.0%",
    imageBrief:
      "Real factory-floor photography — CNC or robotics assembly, cool industrial light, no people identifiable, no stock-photo staging.",
  },
  {
    slug: "clinical-diagnostics",
    company: "Clinical Diagnostics",
    category: "Healthcare",
    image: null,
    description:
      "Recurring-revenue diagnostics and life-science tooling. Demand is structural, not cyclical, and regulation is a moat.",
    performance: "+9.8% p.a.",
    allocation: "11.5%",
    imageBrief:
      "Real laboratory photography — instrumentation detail, shallow depth of field, clinical and restrained. No models in lab coats.",
  },
  {
    slug: "grid-infrastructure",
    company: "Grid Infrastructure",
    category: "Infrastructure",
    image: null,
    description:
      "Regulated transmission and storage assets. Inflation-linked cash flows with contract terms measured in decades.",
    performance: "+8.2% p.a.",
    allocation: "16.5%",
    imageBrief:
      "Real photography of transmission infrastructure or a substation — architectural framing, overcast light, monumental not industrial-grim.",
  },
  {
    slug: "japanese-governance",
    company: "Japanese Governance Reform",
    category: "Global Equity",
    image: null,
    description:
      "Balance-sheet reform across the Topix. A generational reallocation of idle corporate capital, moving at a deliberate pace.",
    performance: "+13.1% p.a.",
    allocation: "12.0%",
    imageBrief:
      "Real architectural photography of a Tokyo financial-district building — Marunouchi or Otemachi, early morning, no signage or logos.",
  },
  {
    slug: "timber-farmland",
    company: "Timber & Farmland",
    category: "Real Assets",
    image: null,
    description:
      "Biological growth compounds regardless of market sentiment. The asset appreciates while you wait for the price.",
    performance: "+7.6% p.a.",
    allocation: "9.0%",
    imageBrief:
      "Real photography of managed forestry or agricultural land — aerial or wide, ordered planting rows visible, soft natural light.",
  },
  {
    slug: "succession-capital",
    company: "Succession Capital",
    category: "Private Markets",
    image: null,
    description:
      "Minority stakes in founder-led businesses at generational handover. Patient capital where speed is a liability.",
    performance: "+15.3% p.a.",
    allocation: "8.5%",
    imageBrief:
      "Real photography of a workshop or family-owned manufacturing interior — craft detail, warm but restrained, documentary not lifestyle.",
  },
];
