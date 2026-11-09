import type { Metadata } from "next";
import Section from "@/components/Section";
import QuoteForm from "@/components/QuoteForm";
import { business } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact / request a quote",
  description: "Request a survey quote online, or contact Four Points Surveyors directly by phone, text, or email.",
};

export default function ContactPage() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Request a quote
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground-muted">
            Tell us a bit about the property and what you need, and
            we&apos;ll follow up with a price. For the fastest response on
            something urgent, call or text directly.
          </p>
          <div className="mt-8">
            <QuoteForm />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Call or text
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
              {business.team.map((member) => (
                <li key={member.name}>
                  <span className="font-medium text-foreground">{member.name}</span>
                  {member.preferred && (
                    <span className="ml-1.5 text-xs text-brand">(text for fastest response)</span>
                  )}
                  <br />
                  {member.phone}
                  {member.email && (
                    <>
                      <br />
                      {member.email}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Mail
            </h2>
            <p className="mt-3 text-sm text-foreground-muted">
              {business.name}
              <br />
              {business.mailingAddress}
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Hours
            </h2>
            <p className="mt-3 text-sm text-foreground-muted">{business.hours}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
