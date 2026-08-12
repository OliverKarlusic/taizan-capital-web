import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import {
  TerminalDisclaimer,
  TerminalNav,
} from "@/components/research/TerminalChrome";

/**
 * The Research Terminal shell.
 *
 * ── SAME SITE, DIFFERENT ROOM ───────────────────────────────────────
 * The main navigation, brand lockup, palette and typography carry
 * straight through — this is Taizan, not a separate product. What
 * changes is density. The marketing pages breathe on purpose, with
 * py-28 sections and 70-character measures; a research workspace that
 * did the same would waste the screen the reader came here to use. So
 * the container widens to the navbar's own max-w-[110rem], vertical
 * rhythm tightens, and figures are set in tabular numerals.
 *
 * ── NO CINEMATIC ENTRY ──────────────────────────────────────────────
 * There is no hero, no scroll-triggered reveal and no transition
 * sequence in here. Registering "I am in the research environment"
 * should cost nothing; the workspace bar does it in one line, and the
 * reader gets to work.
 *
 * The disclaimer is rendered by this layout rather than by each page, so
 * every route under /research carries it whether or not its author
 * remembered.
 */

export const metadata: Metadata = {
  title: "Research Terminal — Taizan Capital",
  description:
    "Market screener and company research. Delayed market data, objective ratios, and no ratings or recommendations.",
};

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar solid />
      <TerminalNav />
      <main id="main" className="relative min-h-[60vh] bg-ink">
        {children}
      </main>
      <TerminalDisclaimer />
    </>
  );
}
