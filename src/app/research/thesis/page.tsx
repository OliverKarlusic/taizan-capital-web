import type { Metadata } from "next";
import ThesisClient from "@/components/research/ThesisClient";

export const metadata: Metadata = {
  title: "Thesis Monitoring — Taizan Capital",
  description:
    "Your recorded theses, with the measurable conditions you set re-checked against current delayed data.",
};

export default function ThesisPage() {
  return (
    <div className="mx-auto max-w-[110rem] px-6 py-10 lg:px-10">
      <h1 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-tight text-paper">
        Thesis Monitoring
      </h1>
      <p className="mt-3 max-w-[80ch] text-[0.85rem] font-light leading-[1.85] text-paper-dim">
        What you expected of a security, the figures that were true when you
        wrote it down, and whether the conditions you set have since been
        met. The terminal measures your criteria; it does not form a view of
        its own and publishes no rating or recommendation.
      </p>
      <ThesisClient />
    </div>
  );
}
