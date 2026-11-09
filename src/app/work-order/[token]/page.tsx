import Section from "@/components/Section";
import WorkOrderResponseForm from "@/components/WorkOrderResponseForm";
import { business } from "@/lib/content";
import { getQuoteRequestById, isSheetsConfigured } from "@/lib/googleSheets";
import { isWorkOrderTokenConfigured, verifyWorkOrderToken } from "@/lib/workOrderToken";

export const dynamic = "force-dynamic";

function Message({ children }: { children: React.ReactNode }) {
  return (
    <Section>
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm leading-relaxed text-foreground-muted">{children}</p>
      </div>
    </Section>
  );
}

export default async function WorkOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isWorkOrderTokenConfigured() || !isSheetsConfigured()) {
    return <Message>This link isn&apos;t available right now. Please call or text us directly.</Message>;
  }

  const result = verifyWorkOrderToken(token);
  if (!result.valid) {
    const message = result.reason === "expired"
      ? "This link has expired. Call or text us and we'll send a new one."
      : "This link isn't valid. Double check the link, or call or text us directly.";
    return <Message>{message}</Message>;
  }

  const quote = await getQuoteRequestById(result.quoteId);
  if (!quote) {
    return <Message>We couldn&apos;t find this quote request. Please call or text us directly.</Message>;
  }

  if (quote.status === "Accepted") {
    return (
      <Message>
        This work order was already accepted{quote.signedAt ? ` on ${quote.signedAt}` : ""}. If that
        wasn&apos;t you, call or text us right away.
      </Message>
    );
  }
  if (quote.status === "Declined") {
    return <Message>This quote was already declined. Call or text us if you&apos;d like a new quote.</Message>;
  }

  return (
    <Section>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Review your work order
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Here&apos;s what you requested and the price from {business.team[0].name}. Review it and
          accept or decline below.
        </p>

        <dl className="mt-8 divide-y divide-border border-y border-border text-sm">
          {(
            [
              ["Name", quote.name],
              ["Phone", quote.phone],
              ["Email", quote.email],
              ["Property address", quote.propertyAddress],
              quote.county ? ["County", quote.county] : null,
              ["Type of survey", quote.surveyType],
              ["Wood stakes along lines", quote.wantsLineStakes ? "Yes" : "No (corners only)"],
              quote.acreage ? ["Approx. acreage", quote.acreage] : null,
              quote.timeline ? ["Timeline", quote.timeline] : null,
              quote.notes ? ["Notes", quote.notes] : null,
            ].filter((row): row is [string, string] => row !== null)
          ).map(([label, value]) => (
            <div key={label} className="grid grid-cols-[140px_1fr] gap-4 py-3">
              <dt className="font-medium text-foreground">{label}</dt>
              <dd className="text-foreground-muted">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Price</p>
          <p className="mt-1 font-display text-3xl font-semibold text-brand">${quote.price}</p>
        </div>

        <div className="mt-8">
          <WorkOrderResponseForm token={token} />
        </div>
      </div>
    </Section>
  );
}
