import Link from "next/link";
import Section from "@/components/Section";
import AdminQuoteList from "@/components/AdminQuoteList";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import { isSheetsConfigured, getOpenQuoteRequests } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSheetsConfigured()) {
    return (
      <Section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-foreground">Open quote requests</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/schedule"
              className="text-sm text-brand underline underline-offset-2 hover:text-brand-dark"
            >
              Job schedule
            </Link>
            <AdminSignOutButton />
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground-muted">
          Google Sheets isn&apos;t configured on this deployment yet, so there&apos;s nothing to show here.
        </p>
      </Section>
    );
  }

  const quotes = await getOpenQuoteRequests();

  return (
    <Section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">Open quote requests</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/schedule"
            className="text-sm text-brand underline underline-offset-2 hover:text-brand-dark"
          >
            Job schedule
          </Link>
          <AdminSignOutButton />
        </div>
      </div>
      <p className="mt-2 text-sm text-foreground-muted">
        Set a price to email the customer a link to review and accept or decline.
        Already-quoted requests stay here until they&apos;re accepted or declined.
      </p>
      <div className="mt-8">
        <AdminQuoteList initialQuotes={quotes} />
      </div>
    </Section>
  );
}
