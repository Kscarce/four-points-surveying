import type { Metadata } from "next";
import Image from "next/image";
import Section from "@/components/Section";

export const metadata: Metadata = {
  title: "Examples",
  description: "An example of our lot and loan surveys, including corner photos for easy relocation.",
};

export default function ExamplesPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Example of our lot / loan surveys
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        All of our lot and loan surveys include six full-color photos of
        the property corners, making it easy to relocate them later.
      </p>

      <div className="mt-8 max-w-xl overflow-hidden rounded border border-border bg-surface">
        <Image
          src="/examples/lot-survey-example.png"
          alt="Example lot survey map, with the client's name and address blurred for privacy"
          width={690}
          height={1065}
          className="h-auto w-full"
        />
        <p className="border-t border-border px-3 py-2 text-xs text-foreground-muted">
          Client name, address, and deed/PIN details are blurred for privacy.
          Your survey will show your own property&apos;s information in full.
        </p>
      </div>
    </Section>
  );
}
