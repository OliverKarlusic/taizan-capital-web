import type { Metadata } from "next";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/sections/Footer";
import {
  ARRANGEMENTS,
  DOCUMENTS,
  IS_LICENSED,
  REGISTRY,
  type RegistryField,
} from "@/lib/compliance";

export const metadata: Metadata = {
  title: "Regulatory Disclosures — Taizan Capital",
  description:
    "Entity details, licensing status, disclosure documents and operational arrangements for Taizan Capital.",
};

/**
 * Regulatory disclosures.
 *
 * The page renders the register from src/lib/compliance.ts. Fields with no
 * value are shown as outstanding rather than hidden — a prospective
 * investor should be able to see both what exists and what does not, and
 * an empty register that admits it is empty is more trustworthy than a
 * page that quietly omits the question.
 */

function Row({ f }: { f: RegistryField }) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-2 border-t border-paper/10 py-6 sm:grid-cols-12">
      <dt className="text-[0.72rem] uppercase tracking-[0.18em] text-stone sm:col-span-4">
        {f.label}
      </dt>
      <dd className="sm:col-span-8">
        {f.value ? (
          <span className="tabular text-[0.95rem] text-paper">{f.value}</span>
        ) : (
          <span className="text-[0.85rem] italic text-stone-dim">
            Not yet issued
          </span>
        )}
        <p className="mt-2 max-w-[62ch] text-[0.78rem] font-light leading-[1.8] text-stone">
          {f.note}
        </p>
      </dd>
    </div>
  );
}

export default function DisclosuresPage() {
  return (
    <>
      <Navbar solid />
      <main className="relative bg-ink">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-40 lg:px-10">
          <p className="overline-label">Regulatory</p>
          <h1 className="mt-5 max-w-[20ch] font-serif text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.1] text-paper">
            Disclosures
          </h1>

          {/* The honest headline. A visitor should learn the firm's status
              in the first sentence, not infer it from empty fields. */}
          {!IS_LICENSED ? (
            <div className="mt-12 border-l-2 border-gold/50 py-2 pl-7">
              <p className="max-w-[64ch] text-[0.95rem] font-light leading-[1.95] text-paper-dim">
                Taizan Capital does not currently hold an Australian
                Financial Services Licence and is not yet authorised to
                provide financial services. Nothing on this website is an
                offer of a financial product, a recommendation, or financial
                product advice.
              </p>
              <p className="mt-5 max-w-[64ch] text-[0.85rem] font-light leading-[1.9] text-stone">
                The register below sets out the details that will be
                published once licensing is in place. Fields are shown
                outstanding rather than hidden — you should be able to see
                what exists and what does not.
              </p>
            </div>
          ) : null}
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16 lg:px-10">
          <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
            Entity &amp; licensing
          </h2>
          <dl className="mt-8">
            {REGISTRY.map((f) => (
              <Row key={f.label} f={f} />
            ))}
          </dl>
        </section>

        <section className="border-t border-paper/10 bg-ink-soft">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
            <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Disclosure documents
            </h2>
            <ul className="mt-8">
              {DOCUMENTS.map((d) => (
                <li
                  key={d.name}
                  className="grid grid-cols-1 gap-x-10 gap-y-2 border-t border-paper/10 py-6 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <span className="text-[0.95rem] text-paper">{d.name}</span>
                  </div>
                  <div className="sm:col-span-8">
                    {d.href ? (
                      <a
                        href={d.href}
                        className="text-[0.85rem] text-gold underline-offset-4 hover:underline"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-[0.85rem] italic text-stone-dim">
                        Not yet published
                      </span>
                    )}
                    <p className="mt-2 max-w-[62ch] text-[0.78rem] font-light leading-[1.8] text-stone">
                      {d.note}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
          <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
            Operational arrangements
          </h2>
          <dl className="mt-8">
            {ARRANGEMENTS.map((f) => (
              <Row key={f.label} f={f} />
            ))}
          </dl>
        </section>

        <section className="border-t border-paper/10">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-10">
            <h2 className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              General information
            </h2>
            <div className="mt-8 space-y-6 border-t border-paper/10 pt-8">
              <p className="max-w-[74ch] text-[0.82rem] font-light leading-[1.9] text-stone">
                Any information on this website is general in nature. It does
                not take into account your objectives, financial situation or
                needs, and you should consider whether it is appropriate for
                you before acting on it.
              </p>
              <p className="max-w-[74ch] text-[0.82rem] font-light leading-[1.9] text-stone">
                Taizan Capital does not publish performance data. No returns,
                benchmarks, track record or client statistics appear anywhere
                on this website, and none should be inferred. Verified
                figures will be reported once a record exists, with the
                disclosures that must accompany them.
              </p>
              <p className="max-w-[74ch] text-[0.82rem] font-light leading-[1.9] text-stone">
                Investing carries risk, including the loss of capital. Past
                performance is not an indicator of future performance.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
