import type { Metadata } from "next";
import Section from "@/components/Section";
import SurveyPlaceholder from "@/components/SurveyPlaceholder";

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

      <div className="mt-8 max-w-xl">
        <SurveyPlaceholder />
        {/* TODO: replace with the real example survey photo/scan once
            supplied, e.g. /public/examples/lot-survey-example.jpg */}
        <p className="mt-2 text-xs text-foreground-muted">
          Placeholder graphic. Swap in the real example survey image here.
        </p>
      </div>
    </Section>
  );
}
