"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EMPTY,
  readStore,
  writeStore,
  type StoreShape,
  type Thesis,
  type WatchItem,
} from "@/lib/research/store";

/**
 * React access to the browser-local research store.
 *
 * ── HYDRATION ───────────────────────────────────────────────────────
 * The first render must match the server's, and the server has no
 * localStorage. So state starts empty and loads in an effect, and
 * `ready` distinguishes "not read yet" from "read, and genuinely
 * empty" — without it every page would flash its empty state on load
 * and tell a reader with fifty watched securities that they have none.
 *
 * Changes in another tab arrive through the storage event; changes in
 * this tab through a custom event, because storage does not fire in the
 * tab that wrote.
 *
 * Mutations re-read from storage before writing rather than working from
 * React state, so two tabs open at once do not overwrite each other with
 * a stale snapshot.
 */
export function useResearchStore() {
  const [store, setStore] = useState<StoreShape>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(readStore());
    setReady(true);

    const sync = () => setStore(readStore());
    window.addEventListener("storage", sync);
    window.addEventListener("taizan:store", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("taizan:store", sync);
    };
  }, []);

  const commit = useCallback((next: StoreShape) => {
    setStore(next);
    writeStore(next);
  }, []);

  /* ── watchlist ── */

  const isWatched = useCallback(
    (symbol: string) =>
      store.watchlist.some(
        (w) => w.symbol.toUpperCase() === symbol.toUpperCase(),
      ),
    [store.watchlist],
  );

  const addWatch = useCallback(
    (item: Omit<WatchItem, "addedAt">) => {
      const current = readStore();
      if (
        current.watchlist.some(
          (w) => w.symbol.toUpperCase() === item.symbol.toUpperCase(),
        )
      ) {
        return;
      }
      commit({
        ...current,
        watchlist: [
          ...current.watchlist,
          { ...item, addedAt: new Date().toISOString() },
        ],
      });
    },
    [commit],
  );

  const removeWatch = useCallback(
    (symbol: string) => {
      const current = readStore();
      commit({
        ...current,
        watchlist: current.watchlist.filter(
          (w) => w.symbol.toUpperCase() !== symbol.toUpperCase(),
        ),
      });
    },
    [commit],
  );

  const toggleWatch = useCallback(
    (item: Omit<WatchItem, "addedAt">) => {
      if (isWatched(item.symbol)) removeWatch(item.symbol);
      else addWatch(item);
    },
    [isWatched, addWatch, removeWatch],
  );

  /* ── theses ── */

  const thesisFor = useCallback(
    (symbol: string) =>
      store.theses.find(
        (t) => t.symbol.toUpperCase() === symbol.toUpperCase(),
      ) ?? null,
    [store.theses],
  );

  const saveThesis = useCallback(
    (thesis: Thesis) => {
      const current = readStore();
      const rest = current.theses.filter(
        (t) => t.symbol.toUpperCase() !== thesis.symbol.toUpperCase(),
      );
      commit({ ...current, theses: [...rest, thesis] });
    },
    [commit],
  );

  const removeThesis = useCallback(
    (symbol: string) => {
      const current = readStore();
      commit({
        ...current,
        theses: current.theses.filter(
          (t) => t.symbol.toUpperCase() !== symbol.toUpperCase(),
        ),
      });
    },
    [commit],
  );

  return {
    store,
    ready,
    isWatched,
    addWatch,
    removeWatch,
    toggleWatch,
    thesisFor,
    saveThesis,
    removeThesis,
  };
}
