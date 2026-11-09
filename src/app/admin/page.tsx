import Section from "@/components/Section";
import AdminQuoteList from "@/components/AdminQuoteList";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import { isSheetsConfigured, getOpenQuoteRequests } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSheetsConfigured()) {
    return (
      <Section>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-foreground">Open quote requests</h1>
          <AdminSignOutButton />
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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-foreground">Open quote requests</h1>
        <AdminSignOutButton />
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
