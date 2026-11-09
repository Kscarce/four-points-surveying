import type { Metadata } from "next";
import Link from "next/link";
import Section from "@/components/Section";
import { services, callForQuoteServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services & prices",
  description:
    "Residential lot and loan survey pricing, house stakeout packages, and other land surveying services across the Piedmont Triad.",
};

export default function ServicesPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Services & prices
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        Starting prices below. Final pricing depends on the property&apos;s
        size, terrain, and how much existing survey data is on record for
        it. Send a quote request with the property address and what you
        need, and we&apos;ll follow up with an exact price.
      </p>

      <div className="mt-10 space-y-8">
        {services.map((service) => (
          <article key={service.id} className="border border-border p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {service.name}
              </h2>
              <p className="font-display text-xl font-semibold text-brand-700">
                Starting at ${service.startingPrice.toLocaleString()}
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              {service.description}
            </p>
            <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-sm text-foreground sm:grid-cols-2">
              {service.highlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="text-brand-600">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
            {"note" in service && service.note && (
              <p className="mt-4 border-t border-border pt-4 text-xs text-foreground-muted">
                {service.note}
              </p>
            )}
          </article>
        ))}

        <article className="border border-dashed border-border p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Also available, call for pricing
          </h2>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-foreground sm:grid-cols-2">
            {callForQuoteServices.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-brand-600">&bull;</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-foreground-muted">
            These vary too much by property to post a starting price.
            Send a quote request and we&apos;ll get back to you with a
            number.
          </p>
        </article>
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <Link
          href="/contact"
          className="inline-block rounded-sm bg-brand-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-800"
        >
          Request a quote
        </Link>
      </div>
    </Section>
  );
}
