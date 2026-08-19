"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The terminal's command entry.
 *
 * ── WHAT PROBLEM THIS SOLVES ────────────────────────────────────────
 * The audit found no fast path to a security and no orientation for a
 * first-time visitor. Reaching a company meant loading the screener,
 * scrolling or filtering, and clicking — three steps and a page load to
 * do the thing an analyst does most often.
 *
 * ── AND WHY IT ANSWERS THE SECOND HALF TOO ──────────────────────────
 * A blank input is not self-explanatory either, so an empty bar shows
 * what can be typed, and HELP opens a panel written for someone who has
 * never used a terminal. The control that makes an expert fast is also
 * the one place a newcomer will look first.
 *
 * ── ON RESOLUTION ───────────────────────────────────────────────────
 * Typing resolves against the live search endpoint rather than a local
 * list, so anything the feed knows is reachable — including securities
 * outside the screener's index coverage. No result is ever invented and
 * no nearest match is auto-selected: an empty result says so, because a
 * terminal that silently answers a different question than the one
 * asked is worse than one that admits it does not know.
 */

interface Hit {
  symbol: string;
  name: string | null;
  exchange: string | null;
  market: string | null;
  securityType: string | null;
}

const HISTORY_KEY = "taizan.commands.v1";
const HISTORY_MAX = 12;

/** Commands that are words rather than tickers. */
const WORDS: Record<string, { go: string; blurb: string }> = {
  SCREEN: { go: "/research", blurb: "Open the market screener" },
  SCREENER: { go: "/research", blurb: "Open the market screener" },
  WATCH: { go: "/research/watchlist", blurb: "Open your watchlist" },
  WATCHLIST: { go: "/research/watchlist", blurb: "Open your watchlist" },
  THESIS: { go: "/research/thesis", blurb: "Open thesis monitoring" },
  COVERAGE: { go: "/research/coverage", blurb: "What this terminal can answer" },
};

export default function CommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [cursor, setCursor] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [history, setHistory] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as string[]);
    } catch {
      /* a corrupt history is not worth failing the bar over */
    }
  }, []);

  /** "/" focuses, unless the reader is already typing somewhere. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
        // Focus after the input exists.
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === "Escape") {
        setHelp(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Resolve against the feed, debounced. */
  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) {
      setHits([]);
      setState("idle");
      return;
    }
    const id = ++reqRef.current;
    setState("loading");
    const t = setTimeout(() => {
      fetch(`/api/research/search?q=${encodeURIComponent(term)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
        .then((j: { results?: Hit[] }) => {
          if (id !== reqRef.current) return;
          setHits(j.results ?? []);
          setCursor(0);
          setState("idle");
        })
        .catch(() => {
          if (id === reqRef.current) setState("error");
        });
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const remember = useCallback((entry: string) => {
    setHistory((h) => {
      const next = [entry, ...h.filter((x) => x !== entry)].slice(0, HISTORY_MAX);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* private mode; the bar still works without a history */
      }
      return next;
    });
  }, []);

  const go = useCallback(
    (path: string, entry: string) => {
      remember(entry);
      setOpen(false);
      setQ("");
      setHits([]);
      router.push(path);
    },
    [remember, router],
  );

  const word = WORDS[q.trim().toUpperCase()];

  const submit = () => {
    const term = q.trim();
    if (!term) return;
    if (term.toUpperCase() === "HELP") {
      remember("HELP");
      setHelp(true);
      setQ("");
      return;
    }
    if (word) return go(word.go, term.toUpperCase());
    // A highlighted result wins over the raw text, because the reader
    // has seen it and chosen it.
    const hit = hits[cursor];
    if (hit) return go(`/research/${encodeURIComponent(hit.symbol)}`, hit.symbol);
    // Nothing resolved. The ticker is tried as typed rather than
    // guessing a near match; the company route says plainly when a
    // symbol does not exist.
    go(`/research/${encodeURIComponent(term.toUpperCase())}`, term.toUpperCase());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(hits.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="inline-flex min-h-11 items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-stone transition-colors hover:text-gold"
        >
          Search
          <kbd className="rounded-sm border border-paper/20 px-1.5 py-0.5 text-[0.55rem] tracking-normal text-stone-dim">
            /
          </kbd>
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/80 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command bar"
            className="w-full max-w-[42rem] border border-paper/15 bg-ink-soft"
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              aria-label="Type a ticker, a company name, or a command"
              placeholder="Ticker, company name, or a command — try BHP, Apple, SCREEN, HELP"
              className="w-full bg-transparent px-5 py-4 text-[0.95rem] text-paper outline-none placeholder:text-stone-dim"
            />

            <div className="max-h-[54vh] overflow-y-auto border-t border-paper/10">
              {word ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={submit}
                  className="flex w-full items-baseline justify-between gap-4 px-5 py-3 text-left hover:bg-paper/[0.04]"
                >
                  <span className="text-[0.85rem] text-gold">
                    {q.trim().toUpperCase()}
                  </span>
                  <span className="text-[0.7rem] text-stone">{word.blurb}</span>
                </button>
              ) : null}

              {state === "error" ? (
                <p className="px-5 py-6 text-[0.8rem] text-paper-dim">
                  Search could not be reached. Nothing is shown rather than
                  guessed results.
                </p>
              ) : null}

              {!word && q.trim() && state !== "loading" && !hits.length && state !== "error" ? (
                <p className="px-5 py-6 text-[0.8rem] text-stone">
                  No listing matches “{q.trim()}”. Australian tickers need the
                  .AX suffix — BHP.AX rather than BHP.
                </p>
              ) : null}

              {hits.map((h, i) => (
                <button
                  key={h.symbol}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() =>
                    go(`/research/${encodeURIComponent(h.symbol)}`, h.symbol)
                  }
                  className={`flex w-full items-baseline justify-between gap-4 px-5 py-3 text-left ${
                    i === cursor ? "bg-paper/[0.06]" : "hover:bg-paper/[0.04]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="tabular text-[0.85rem] text-gold">
                      {h.symbol}
                    </span>
                    <span className="ml-3 text-[0.82rem] font-light text-paper-dim">
                      {h.name ?? ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.6rem] uppercase tracking-[0.16em] text-stone-dim">
                    {h.market ?? h.exchange ?? ""}
                    {h.securityType === "etf" ? " · ETF" : ""}
                  </span>
                </button>
              ))}

              {!q.trim() ? (
                <div className="px-5 py-4">
                  {history.length ? (
                    <>
                      <p className="text-[0.58rem] uppercase tracking-[0.2em] text-stone-dim">
                        Recent
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {history.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setQ(h)}
                            className="border border-paper/15 px-2.5 py-1 text-[0.7rem] text-stone hover:text-paper"
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}

                  <p className="mt-4 text-[0.7rem] leading-[1.9] text-stone-dim">
                    Type a ticker (BHP.AX, NVDA) or a company name. Commands:{" "}
                    <span className="text-stone">SCREEN</span>,{" "}
                    <span className="text-stone">WATCH</span>,{" "}
                    <span className="text-stone">THESIS</span>,{" "}
                    <span className="text-stone">COVERAGE</span>,{" "}
                    <span className="text-stone">HELP</span>. Arrow keys move,
                    Enter opens, Escape closes.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {help ? <Help onClose={() => setHelp(false)} /> : null}
    </>
  );
}

/**
 * HELP, written for someone who has never used a research terminal.
 *
 * It says what the data is and is not, because the most expensive
 * misunderstanding here is not "which key do I press" — it is a reader
 * treating a delayed price as live, or an estimate as a result.
 */
function Help({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-ink/95 px-6 py-12 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Help"
        className="mx-auto max-w-[64rem] border border-paper/15 bg-ink-soft px-7 py-9 sm:px-10"
      >
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="font-serif text-2xl text-paper">
            Using the Research Terminal
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 text-[0.62rem] uppercase tracking-[0.2em] text-stone hover:text-gold"
          >
            Close
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-x-14 gap-y-9 lg:grid-cols-2">
          <section>
            <h3 className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
              Finding a security
            </h3>
            <p className="mt-3 text-[0.82rem] font-light leading-[1.9] text-paper-dim">
              Press <Kbd>/</Kbd> anywhere to open the search bar. Type a
              ticker or a company name. Australian listings carry a{" "}
              <span className="text-paper">.AX</span> suffix — BHP.AX is the
              ASX line, BHP without it is the New York listing of the same
              company, priced in US dollars.
            </p>
          </section>

          <section>
            <h3 className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
              What is covered
            </h3>
            <p className="mt-3 text-[0.82rem] font-light leading-[1.9] text-paper-dim">
              Listed equities and exchange-traded funds on the ASX, NYSE and
              Nasdaq. The screener lists an index-constituent universe;
              search reaches beyond it to anything the data feed knows. The
              Coverage page states, capability by capability, what this
              terminal can and cannot answer and why.
            </p>
          </section>

          <section>
            <h3 className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
              Reading the numbers
            </h3>
            <p className="mt-3 text-[0.82rem] font-light leading-[1.9] text-paper-dim">
              Any label with a dotted underline has a plain-language
              definition — hover it. An em dash{" "}
              <span className="text-paper">—</span> means the data source did
              not supply that figure; nothing is estimated in its place.{" "}
              <span className="text-paper">N/M</span> means the arithmetic
              works but the answer would not mean anything, such as a
              price-to-earnings multiple on a company that made a loss.
            </p>
          </section>

          <section>
            <h3 className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
              How current the data is
            </h3>
            <p className="mt-3 text-[0.82rem] font-light leading-[1.9] text-paper-dim">
              Prices are delayed, and every figure carries the time it was
              retrieved. Beside it you will see whether that market is open,
              closed, pre-market or on holiday — a price quoted while the
              exchange is shut is the last completed session, not a
              near-current one.
            </p>
          </section>

          <section>
            <h3 className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
              The chart
            </h3>
            <p className="mt-3 text-[0.82rem] font-light leading-[1.9] text-paper-dim">
              Ten ranges from one day to the full listed history. Hover to
              read an exact close, or focus the chart and use the arrow keys
              to step through observations one at a time. A range the feed
              has no data for is disabled rather than quietly showing a
              shorter period.
            </p>
          </section>

          <section>
            <h3 className="text-[0.6rem] uppercase tracking-[0.24em] text-gold">
              What this terminal will not do
            </h3>
            <p className="mt-3 text-[0.82rem] font-light leading-[1.9] text-paper-dim">
              It publishes no ratings, no price targets and no buy, sell or
              hold conclusions, and it never will while Taizan Capital holds
              no Australian Financial Services Licence. It gives you the
              evidence — figures, ranges, the analyst count behind an
              estimate — and the conclusion stays yours.
            </p>
          </section>
        </div>

        <p className="mt-10 border-t border-paper/10 pt-6 text-[0.68rem] leading-[1.85] text-stone-dim">
          Keyboard: <Kbd>/</Kbd> opens search · <Kbd>↑</Kbd> <Kbd>↓</Kbd> move
          through results · <Kbd>Enter</Kbd> opens · <Kbd>Esc</Kbd> closes.
          Commands: SCREEN, WATCH, THESIS, COVERAGE, HELP.
        </p>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm border border-paper/20 px-1.5 py-0.5 text-[0.6rem] text-stone">
      {children}
    </kbd>
  );
}
