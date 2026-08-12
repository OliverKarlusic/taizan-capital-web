"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * The Terminal's own chrome: workspace nav, and the disclaimer that has to
 * be on every surface inside here.
 *
 * ── WHY THE WORKSPACE NAV IS SHORT ──────────────────────────────────
 * It lists the Screener and nothing else, because the Screener is what
 * exists. Compare, Watchlist and a standalone Valuation workspace are not
 * built, so they are not in the nav — a disabled tab for something with no
 * data source behind it is an advertisement for vapour, and the brief is
 * explicit that only implemented functionality appears. The company page
 * lists its own unavailable sections, which is a different case: there the
 * reader is looking at one company and needs to know what is missing
 * about it.
 *
 * ── THE ROUTE HOME IS ALWAYS PRESENT ────────────────────────────────
 * Twice, in fact: the brand lockup in the main navigation above, and the
 * explicit link here. Nobody should have to guess how to get out of a
 * workspace and back to the site.
 */

const WORKSPACES = [{ href: "/research", label: "Screener" }];

export function TerminalNav() {
  const pathname = usePathname();

  // Vertical padding sits on the links themselves rather than on the bar,
  // so the bar keeps its height while every target inside it clears 44px.
  // The workspace links measured 74x16 and 88x15 on a phone, which is a
  // precise-mouse target on a device that has no mouse.
  return (
    <div className="sticky top-[4.5rem] z-40 border-b border-paper/10 bg-ink/95 backdrop-blur-sm lg:top-[5.25rem]">
      <div className="mx-auto flex max-w-[110rem] flex-wrap items-center gap-x-8 px-6 lg:px-10">
        <span className="py-3.5 text-[0.6rem] uppercase tracking-[0.28em] text-gold">
          Research Terminal
        </span>

        <nav aria-label="Research workspace" className="flex items-center gap-6">
          {WORKSPACES.map((w) => {
            const active = pathname === w.href;
            return (
              <Link
                key={w.href}
                href={w.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center text-[0.68rem] uppercase tracking-[0.2em] transition-colors duration-300 ${
                  active
                    ? "text-paper"
                    : "text-stone hover:text-paper-dim"
                }`}
              >
                {w.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="group ml-auto inline-flex min-h-11 items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-stone transition-colors duration-300 hover:text-gold"
        >
          <ArrowLeft
            size={12}
            strokeWidth={1.5}
            className="transition-transform duration-300 group-hover:-translate-x-0.5"
          />
          Main site
        </Link>
      </div>
    </div>
  );
}

/**
 * The compliance line.
 *
 * Section 6 of the brief requires this on every Terminal surface, in the
 * site's own register rather than as a bolted-on legal notice. It is
 * rendered by the layout, so a new page inside /research cannot be
 * shipped without it.
 */
export function TerminalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[0.62rem] leading-relaxed tracking-wide text-stone-dim">
        General information only. No ratings, scores or recommendations are
        published here, and nothing on this page is financial advice.
      </p>
    );
  }

  return (
    <div className="border-t border-paper/10">
      <div className="mx-auto max-w-[110rem] px-6 py-10 lg:px-10">
        <p className="max-w-[92ch] text-[0.68rem] leading-[1.9] tracking-wide text-stone-dim">
          The Research Terminal publishes market data and figures calculated
          from it. It does not publish ratings, scores, price targets, or
          buy, sell and hold conclusions, and no statement here should be
          read as one. Figures are general information only, are not
          personal financial advice, and do not take account of your
          objectives, financial situation or needs.
        </p>
        <p className="mt-4 max-w-[92ch] text-[0.68rem] leading-[1.9] tracking-wide text-stone-dim">
          Market data is sourced from a third-party feed, is delayed, and is
          provided without warranty as to accuracy or completeness. Where a
          figure is unavailable it is shown as an em dash rather than
          estimated. Ratios are computed from the data provider&apos;s
          reported financials and have not been independently audited.
          Taizan Capital does not hold an Australian Financial Services
          Licence and is not accepting external clients or capital.
        </p>
      </div>
    </div>
  );
}

/**
 * A section the terminal does not have data for.
 *
 * It renders the reason. A bare "coming soon" invites the reader to
 * assume the work simply is not done, when the actual constraint is that
 * the free data source does not carry the thing — and for an ASX-heavy
 * universe, that constraint is not going away with more effort alone.
 * Saying which source is missing is more useful than a spinner.
 */
export function Unavailable({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <div className="border border-dashed border-paper/15 px-6 py-12 sm:px-10">
      <p className="text-[0.6rem] uppercase tracking-[0.24em] text-stone-dim">
        Not yet available
      </p>
      <h3 className="mt-4 font-serif text-2xl text-paper-dim">{title}</h3>
      <p className="mt-4 max-w-[62ch] text-[0.85rem] font-light leading-[1.9] text-stone">
        {reason}
      </p>
      <p className="mt-6 max-w-[62ch] text-[0.7rem] leading-[1.8] text-stone-dim">
        Nothing is shown here rather than an approximation. When a source
        that covers both the ASX and the US markets is in place, this
        section will be populated from it.
      </p>
    </div>
  );
}
