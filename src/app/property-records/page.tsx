import type { Metadata } from "next";
import Section from "@/components/Section";
import { countyGisLinks } from "@/lib/content";

export const metadata: Metadata = {
  title: "Property records",
  description: "Look up parcel and GIS records directly from each county we serve.",
};

export default function PropertyRecordsPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Look up your property records
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        Want to see what the county already has on file for your
        property? Each county below runs its own GIS and property
        records system. Keep in mind that county GIS maps are useful for
        ownership and tax information, but they are not an accurate
        source for exact property lines, deed conditions can affect the
        actual boundary in ways a map alone won&apos;t show. For a legally
        accurate boundary, you&apos;ll still need a licensed survey.
      </p>

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {countyGisLinks.map((item) => (
          <li key={item.county} className="flex items-center justify-between gap-4 py-4">
            <span className="text-sm font-medium text-foreground">
              {item.county} County
            </span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-700 underline underline-offset-2 hover:text-brand-800"
            >
              Open GIS site
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-foreground-muted">
        Links go to each county&apos;s own government website and open in
        a new tab.
      </p>
    </Section>
  );
}
