/**
 * Regulatory register — the single place licensing details are entered.
 *
 * ── READ THIS BEFORE FILLING ANYTHING IN ────────────────────────────
 *
 * Every value below is null on purpose. Not one of them may be populated
 * with a placeholder, a "coming soon", or a plausible-looking number.
 *
 * An AFS licence number, ABN and ACN are verifiable government-issued
 * identifiers. Publishing one you do not hold is not a credibility
 * problem — under the Corporations Act, carrying on a financial services
 * business without a licence, or holding out that you are licensed, is an
 * offence. A number typed in "for now" is exactly that.
 *
 * The page renders a field only when it has a real value, and states
 * plainly that the firm is pre-licence otherwise. That is the honest
 * position for a firm at this stage, and a sophisticated investor reads it
 * as candour rather than weakness.
 *
 * ── THE LICENSING DECISION COMES FIRST ──────────────────────────────
 *
 * Before any of this can be filled in, one question has to be answered:
 * hold your own AFS licence, or operate as a Corporate Authorised
 * Representative of an existing licensee. They lead to different fields —
 * an authorised representative publishes the licensee's AFSL alongside
 * their own CAR number. Most emerging managers start as a CAR because
 * the capital, compliance and PI requirements of a own licence are
 * substantial.
 *
 * This is a question for an Australian financial services lawyer or a
 * licensing consultant. It is not a question this file, or the person who
 * wrote it, can answer.
 */

/**
 * The firm's trading status, in the one place it is written.
 *
 * Taizan Capital holds no AFS licence, so it cannot accept external
 * clients or capital. Under s911A of the Corporations Act, carrying on a
 * financial services business without one is an offence, and s911D treats
 * inducing — or attempting to induce — people in Australia to use those
 * services as carrying on that business here. A website that named a
 * minimum investment and ran visitors toward a consultation booking was
 * an attempt to induce, however carefully the surrounding copy was worded.
 *
 * So the site states the position rather than implying it. This is not a
 * disclaimer bolted onto a sales page: the sales page is gone, and these
 * sentences describe what is actually true.
 */
export const IS_OPEN_FOR_BUSINESS = false;

/** One sentence. Used where space is tight. */
export const STATUS_SHORT =
  "Taizan Capital is not currently accepting external clients or capital.";

/** The full position. Used wherever the visitor has room to read it. */
export const STATUS_LONG =
  "Taizan Capital does not hold an Australian Financial Services Licence and is not currently accepting external clients or capital. This website sets out the investment philosophy and strategies of its principal and is published for information only. Nothing on it is an offer, a recommendation, an invitation to invest, or financial product advice.";

export interface RegistryField {
  label: string;
  /** Real, verifiable value only. Null until one exists. */
  value: string | null;
  /** Why it exists, in plain language. Shown to the visitor. */
  note: string;
}

export interface DisclosureDoc {
  name: string;
  /** Path under /public once the document exists. */
  href: string | null;
  note: string;
}

/** Entity and licensing identifiers. */
export const REGISTRY: RegistryField[] = [
  {
    label: "Registered entity",
    value: null,
    note: "The legal name under which the business operates.",
  },
  {
    label: "ABN",
    value: null,
    note: "Australian Business Number, issued by the Australian Business Register.",
  },
  {
    label: "ACN",
    value: null,
    note: "Australian Company Number, issued by ASIC on incorporation.",
  },
  {
    label: "AFS Licence",
    value: null,
    note: "Australian Financial Services Licence number, or the licensee's AFSL where the firm operates as an authorised representative.",
  },
  {
    label: "Authorised Representative",
    value: null,
    note: "Corporate Authorised Representative number, if the firm operates under another entity's licence.",
  },
  {
    label: "Registered office",
    value: null,
    note: "The registered address of the licensed entity.",
  },
];

/** Documents a retail-facing manager is generally expected to publish. */
export const DOCUMENTS: DisclosureDoc[] = [
  {
    name: "Financial Services Guide",
    href: null,
    note: "Who we are, the services we are authorised to provide, how we are paid, and how to complain.",
  },
  {
    name: "Product Disclosure Statement",
    href: null,
    note: "Required for a managed investment product offered to retail clients.",
  },
  {
    name: "Target Market Determination",
    href: null,
    note: "Who a product is designed for, under the design and distribution obligations.",
  },
  {
    name: "Privacy Policy",
    href: null,
    note: "How personal information is collected, held, used and disclosed.",
  },
  {
    name: "Complaints & Dispute Resolution",
    href: null,
    note: "Internal complaints process, and access to AFCA as the external dispute resolution scheme.",
  },
];

/**
 * Operational arrangements a licensee must have in place. These are
 * statements of fact about the business, not documents — each is false
 * until it is true, so each stays null.
 */
export const ARRANGEMENTS: RegistryField[] = [
  {
    label: "Professional indemnity insurance",
    value: null,
    note: "Compensation arrangements required of licensees dealing with retail clients.",
  },
  {
    label: "External dispute resolution",
    value: null,
    note: "Membership of the Australian Financial Complaints Authority.",
  },
  {
    label: "Client money handling",
    value: null,
    note: "How client funds are held, and with which custodian or trustee.",
  },
  {
    label: "Auditor",
    value: null,
    note: "The registered company auditor appointed to the fund.",
  },
];

/** True once the firm can lawfully present itself as licensed. */
export const IS_LICENSED = REGISTRY.some(
  (f) => f.label === "AFS Licence" && f.value !== null,
);
