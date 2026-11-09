import type { Metadata } from "next";
import Section from "@/components/Section";
import Accordion from "@/components/Accordion";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about land surveys, property corners, and county GIS accuracy.",
};

export default function FaqPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Frequently asked questions
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        Don&apos;t see your question answered here? Send us a message on
        the contact page.
      </p>
      <div className="mt-8">
        <Accordion items={faqs.map((f) => ({ ...f }))} />
      </div>
    </Section>
  );
}
