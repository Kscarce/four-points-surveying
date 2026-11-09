import type { Metadata } from "next";
import Section from "@/components/Section";

export const metadata: Metadata = {
  title: "Form downloads",
  description: "Download the survey work order form.",
};

export default function DownloadsPage() {
  return (
    <Section>
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Form downloads
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        Forms you can download and fill out ahead of time.
      </p>

      <div className="mt-8 max-w-xl border border-dashed border-border p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Survey work order
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          {/* TODO: replace this placeholder with the real work order PDF
              (currently work_order_sheet_2024.pdf on the live site) at
              /public/forms/work-order.pdf, or swap this section out
              entirely once the online work order form (Phase 3) is live. */}
          The downloadable work order form will be here. For now, contact
          us directly and we&apos;ll send it to you.
        </p>
      </div>
    </Section>
  );
}
