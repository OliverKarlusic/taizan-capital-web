"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useResearchStore } from "./useResearchStore";
import {
  DASH,
  decimal,
  marketCap as fmtCap,
  percent,
  signedPercent,
} from "@/lib/research/format";

interface QuoteRow {
  symbol: string;
  name: string | null;
  market: string;
  securityType: string;
  currency: string | null;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  trailingPE: number | null;
  dividendYield: number | null;
  quoted: boolean;
}

export default function WatchlistClient() {
  const { store, ready, removeWatch } = useResearchStore();
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [delay, setDelay] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const symbols = useMemo(
    () => store.watchlist.map((w) => w.symbol).join(","),
    [store.watchlist],
  );

  const load = useCallback(async () => {
    if (!symbols) {
      setRows([]);
      return;
    }
    setState("loading");
    try {
      const r = await fetch(
        `/api/research/quotes?symbols=${encodeURIComponent(symbols)}`,
      );
      const j = await r.json();
      if (!r.ok) {
        setState("error");
        return;
      }
      setRows(j.rows);
      setAsOf(j.asOf);
      setDelay(j.delayMinutes ?? null);
      setState("idle");
    } catch {
      setState("error");
    }
  }, [symbols]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const byNote = useMemo(
    () => new Map(store.watchlist.map((w) => [w.symbol.toUpperCase(), w.note])),
    [store.watchlist],
  );

  if (!ready) {
    return (
      <p className="py-16 text-[0.85rem] text-stone">Reading your watchlist…</p>
    );
  }

  if (!store.watchlist.length) {
    return (
      <div className="mt-10 border border-dashed border-paper/15 px-6 py-16 text-center">
        <p className="mx-auto max-w-[56ch] text-[0.95rem] font-light leading-[1.9] text-paper-dim">
          Nothing is being watched yet.
        </p>
        <p className="mx-auto mt-4 max-w-[56ch] text-[0.82rem] font-light leading-[1.85] text-stone">
          Open any company or fund from the screener and add it from its
          research page. The list is stored in this browser only.
        </p>
        <Link
          href="/research"
          className="mt-7 inline-flex min-h-11 items-center text-[0.7rem] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
        >
          Go to the screener
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[0.65rem] tracking-wide">
        <span className="text-stone">
          {store.watchlist.length}{" "}
          {store.watchlist.length === 1 ? "security" : "securities"}
        </span>
        {asOf ? (
          <span className="text-stone-dim">
            Data as of{" "}
            {new Date(asOf).toLocaleString("en-AU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {delay ? ` · delayed ~${delay} min, not real time` : " · delayed, not real time"}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-11 text-[0.65rem] uppercase tracking-[0.2em] text-gold hover:text-gold-bright"
        >
          {state === "loading" ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {state === "error" ? (
        <p className="mt-6 border border-dashed border-paper/15 px-6 py-8 text-[0.85rem] text-paper-dim">
          Market data could not be retrieved. Your watchlist is intact —
          nothing is shown rather than stale figures.
        </p>
      ) : null}

      {/* Tablet and up: table. Phone: cards, same as the screener. */}
      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-paper/15">
              {["Security", "Price", "Change", "Market cap", "P/E", "Yield", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`py-3 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-stone ${
                      i === 0 || i === 6 ? "" : "pl-4 text-right"
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.symbol} className="border-b border-paper/[0.07]">
                <td className="py-3 pr-4">
                  <Link href={`/research/${encodeURIComponent(r.symbol)}`} className="group block">
                    <span className="tabular text-[0.8rem] text-gold group-hover:text-gold-bright">
                      {r.symbol}
                    </span>
                    <span className="mt-0.5 block max-w-[30ch] text-[0.82rem] font-light leading-snug text-paper-dim">
                      {r.name ?? DASH}
                    </span>
                    <span className="mt-0.5 block text-[0.58rem] uppercase tracking-[0.16em] text-stone-dim">
                      {r.market}
                      {r.securityType === "etf" ? " · ETF" : ""}
                      {!r.quoted ? " · quote unavailable" : ""}
                    </span>
                    {byNote.get(r.symbol.toUpperCase()) ? (
                      <span className="mt-1 block max-w-[36ch] text-[0.7rem] font-light italic leading-snug text-stone">
                        {byNote.get(r.symbol.toUpperCase())}
                      </span>
                    ) : null}
                  </Link>
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.85rem] text-paper">
                  {r.price === null ? DASH : decimal(r.price)}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.82rem]">
                  {r.changePercent === null ? (
                    <span className="text-stone-dim">{DASH}</span>
                  ) : (
                    <span className={r.changePercent >= 0 ? "text-gold" : "text-ice"}>
                      {signedPercent(r.changePercent)}
                    </span>
                  )}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.82rem] text-paper-dim">
                  {fmtCap(r.marketCap, null)}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.82rem] text-paper-dim">
                  {r.trailingPE === null ? DASH : decimal(r.trailingPE, 1)}
                </td>
                <td className="tabular py-3 pl-4 text-right text-[0.82rem] text-paper-dim">
                  {percent(r.dividendYield, 2)}
                </td>
                <td className="py-3 pl-4 text-right">
                  <button
                    type="button"
                    onClick={() => removeWatch(r.symbol)}
                    aria-label={`Remove ${r.symbol} from watchlist`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-stone-dim transition-colors duration-300 hover:text-ice"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.symbol} className="border border-paper/12 p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/research/${encodeURIComponent(r.symbol)}`} className="block flex-1">
                <span className="tabular text-[0.8rem] text-gold">{r.symbol}</span>
                <span className="mt-0.5 block text-[0.82rem] font-light leading-snug text-paper-dim">
                  {r.name ?? DASH}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => removeWatch(r.symbol)}
                aria-label={`Remove ${r.symbol} from watchlist`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center text-stone-dim"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-paper/10 pt-3">
              {[
                ["Price", r.price === null ? DASH : decimal(r.price)],
                ["Chg", r.changePercent === null ? DASH : signedPercent(r.changePercent)],
                ["P/E", r.trailingPE === null ? DASH : decimal(r.trailingPE, 1)],
                ["Yield", percent(r.dividendYield, 2)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.55rem] uppercase tracking-[0.16em] text-stone-dim">{k}</dt>
                  <dd className="tabular mt-1 text-[0.78rem] text-paper-dim">{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-[86ch] text-[0.65rem] leading-[1.85] text-stone-dim">
        This watchlist is stored in this browser only. It is not sent to a
        server, is not shared between devices, and clearing site data will
        remove it. There are no accounts on this site, and a server-stored
        list without them would be one list shared by every visitor.
      </p>
    </div>
  );
}
