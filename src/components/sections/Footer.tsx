import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer
      id="contact"
      aria-label="Contact and legal"
      className="relative z-10 border-t border-paper/10 bg-ink"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/brand/taizan-mark.webp"
                srcSet="/media/brand/taizan-mark.webp 1x, /media/brand/taizan-mark@2x.webp 2x"
                alt=""
                width={605}
                height={478}
                loading="lazy"
                decoding="async"
                className="h-16 w-auto"
              />
              <p className="flex flex-col leading-none">
                <span className="font-serif text-2xl tracking-[0.18em] text-paper">
                  TAIZAN
                </span>
                <span className="mt-2 text-[0.6rem] tracking-[0.36em] text-gold">
                  泰山資本 · CAPITAL
                </span>
              </p>
            </div>
            <p className="mt-6 max-w-sm text-sm font-light leading-[1.9] text-stone">
              Asset management in the tradition of the mountain — patient,
              disciplined, and built for the generations that follow.
            </p>
            <a
              href="mailto:enquiries@taizan.example"
              className="group mt-8 inline-flex items-center gap-2 text-sm text-gold transition-colors duration-500 hover:text-gold-bright"
            >
              enquiries@taizan.example
              <ArrowUpRight
                size={15}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </a>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <h3 className="text-[0.65rem] uppercase tracking-[0.28em] text-stone-dim">
              Navigate
            </h3>
            <ul className="mt-6 space-y-3.5">
              {[
                ["#philosophy", "Philosophy"],
                ["#approach", "Approach"],
                ["#portfolio", "Portfolio"],
                ["#insights", "Insights"],
                ["#about", "About"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    className="link-underline text-sm font-light text-paper-dim hover:text-paper"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h3 className="text-[0.65rem] uppercase tracking-[0.28em] text-stone-dim">
              Offices
            </h3>
            <ul className="mt-6 space-y-3.5 text-sm font-light text-paper-dim">
              <li>Marunouchi, Tokyo</li>
              <li>St James&apos;s, London</li>
              <li>Raffles Place, Singapore</li>
            </ul>
          </div>
        </div>

        <div className="mt-20 border-t border-paper/10 pt-10">
          <p className="text-[0.65rem] leading-[1.9] tracking-wide text-stone-dim">
            Taizan Capital is a fictional brand created as a design concept.
            Nothing on this page constitutes investment advice, an offer, or a
            solicitation of any kind. All performance figures, allocations and
            client statistics are illustrative inventions for the purpose of
            demonstrating design. Capital is at risk; past performance — even
            fictional past performance — is not indicative of future results.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-[0.65rem] tracking-[0.2em] text-stone-dim">
              © 2026 TAIZAN CAPITAL — A DESIGN CONCEPT
            </p>
            <p className="font-serif text-sm italic text-stone-dim">
              静水深流 — still waters run deep
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
