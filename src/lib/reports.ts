import { CONVICTIONS } from "@/lib/portfolio";

/**
 * Quarterly reporting and performance.
 *
 * ── HOW TO PUBLISH A REPORT ─────────────────────────────────────────
 * 1. Put the PDF in public/media/reports/  e.g. taizan-2027-q1.pdf
 * 2. Add an entry to REPORTS below with its href and published date.
 * 3. Fill in that quarter's row in PERFORMANCE for each portfolio.
 * 4. Deploy.
 *
 * That is the whole system. No database, no CMS, no upload interface and
 * no running cost — the reports are static files and the manifest is a
 * typed list. It scales to years of quarters before any of that becomes
 * worth adding, and a manifest cannot silently serve a half-uploaded file
 * the way a database row can.
 *
 * ── ON THE NUMBERS ──────────────────────────────────────────────────
 * Every performance value is null. Not zero, not a dash, not a plausible
 * figure — null, so the UI can distinguish "no track record yet" from
 * "flat quarter". Populate only from reconciled, verified figures, and
 * only for periods the fund actually operated.
 *
 * Publishing a return before it is verified is the one mistake in this
 * whole website that cannot be quietly corrected later.
 */

export interface QuarterlyReport {
  /** Sort key and anchor, e.g. "2027-q1". */
  id: string;
  /** Display label, e.g. "Q1 2027". */
  label: string;
  /** Period covered, e.g. "January – March 2027". */
  period: string;
  /** ISO date the report was published. Null until it is. */
  published: string | null;
  /** Path under /public. Null until the PDF exists. */
  href: string | null;
  /** One line on what the quarter covered. */
  summary: string | null;
}

/**
 * Per-portfolio performance for a period. Every field nullable — a
 * portfolio may launch in a different quarter from the others, and the
 * table must be able to say so rather than implying a zero.
 */
export interface PerformanceRow {
  slug: string;
  name: string;
  quarter: string | null;
  oneYear: string | null;
  sinceInception: string | null;
  inceptionDate: string | null;
}

/**
 * Reports, newest first. Empty until the first quarter closes.
 *
 * Example of a populated entry, for whoever adds the first one:
 *
 *   {
 *     id: "2027-q1",
 *     label: "Q1 2027",
 *     period: "January – March 2027",
 *     published: "2027-04-18",
 *     href: "/media/reports/taizan-2027-q1.pdf",
 *     summary: "Portfolio positioning, material changes and commentary.",
 *   }
 */
export const REPORTS: QuarterlyReport[] = [];

/** One row per portfolio, all periods null until a record exists. */
export const PERFORMANCE: PerformanceRow[] = CONVICTIONS.map((c) => ({
  slug: c.slug,
  name: c.name,
  quarter: null,
  oneYear: null,
  sinceInception: null,
  inceptionDate: null,
}));

export const hasReports = REPORTS.some((r) => r.href !== null);
export const hasPerformance = PERFORMANCE.some(
  (p) => p.quarter || p.oneYear || p.sinceInception,
);
