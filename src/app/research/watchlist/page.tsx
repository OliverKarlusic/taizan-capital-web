import type { Metadata } from "next";
import WatchlistClient from "@/components/research/WatchlistClient";

export const metadata: Metadata = {
  title: "Watchlist — Taizan Capital",
  description:
    "Securities you are following, priced from the same delayed feed as the rest of the terminal.",
};

export default function WatchlistPage() {
  return (
    <div className="mx-auto max-w-[110rem] px-6 py-10 lg:px-10">
      <h1 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-tight text-paper">
        Watchlist
      </h1>
      <p className="mt-3 max-w-[76ch] text-[0.85rem] font-light leading-[1.85] text-paper-dim">
        Securities you are following, priced from the same delayed feed as
        every other figure in this terminal. Stored in this browser, not on a
        server.
      </p>
      <WatchlistClient />
    </div>
  );
}
