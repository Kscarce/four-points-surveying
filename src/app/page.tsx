import Link from "next/link";
import Section from "@/components/Section";
import ContourLines from "@/components/ContourLines";
import { business, counties, services, callForQuoteServices } from "@/lib/content";

export default function Home() {
  return (
    <>
      <div className="relative overflow-hidden border-b border-border bg-surface">
        <ContourLines className="absolute inset-0 h-full w-full" />
        <Section className="relative py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brand-700">
              {business.basedIn} &middot; Over 30 years of combined experience
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              {business.tagline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground-muted">
              {business.foundedBlurb}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-sm bg-brand-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                Request a quote
              </Link>
              <Link
                href="/services"
                className="rounded-sm border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-brand-400"
              >
                See services & prices
              </Link>
            </div>
          </div>
        </Section>
      </div>

      <Section>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          What we do
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="border border-border p-6">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {service.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-brand-700">
                Starting at ${service.startingPrice.toLocaleString()}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 border border-dashed border-border p-6">
          <h3 className="font-display text-lg font-semibold text-foreground">
            Also available
          </h3>
          <p className="mt-2 text-sm text-foreground-muted">
            {callForQuoteServices.join(", ")}. Call for pricing on these.
          </p>
        </div>
      </Section>

      <Section className="bg-surface">
        <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Where we work
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              We provide surveying services across {counties.length} counties in
              the Piedmont Triad region of North Carolina.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-foreground">
              {counties.map((county) => (
                <li key={county}>{county} County</li>
              ))}
            </ul>
          </div>
          <div className="border border-border bg-background p-6">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Office hours
            </h3>
            <p className="mt-2 text-sm text-foreground-muted">{business.hours}</p>
            <p className="mt-4 text-sm text-foreground-muted">
              Please call to make an appointment, or send a quote request and
              we&apos;ll get back to you.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
