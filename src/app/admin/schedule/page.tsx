import Link from "next/link";
import Section from "@/components/Section";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import AdminSignOutButton from "@/components/AdminSignOutButton";
import { getScheduleEntries, isScheduleConfigured } from "@/lib/scheduleSheets";
import { getAcceptedQuoteRequests, isSheetsConfigured } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  if (!isScheduleConfigured()) {
    return (
      <Section>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold text-foreground">Job schedule</h1>
          <AdminSignOutButton />
        </div>
        <p className="mt-3 text-sm text-foreground-muted">
          Google Sheets isn&apos;t configured on this deployment yet, so there&apos;s nothing to show here.
        </p>
      </Section>
    );
  }

  const entries = await getScheduleEntries();
  // The accepted-quotes dropdown is a nice-to-have on top of the core
  // schedule feature, so a Sheets hiccup there shouldn't take down the
  // whole page, it should just fall back to typing the job in by hand.
  const acceptedQuotes = isSheetsConfigured() ? await getAcceptedQuoteRequests() : [];

  return (
    <Section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Job schedule</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Add jobs by hand as they get scheduled. Everyone with the staff login sees the same
            calendar.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-sm text-brand underline underline-offset-2 hover:text-brand-dark"
          >
            Quote requests
          </Link>
          <AdminSignOutButton />
        </div>
      </div>

      <div className="mt-8">
        <ScheduleCalendar initialEntries={entries} acceptedQuotes={acceptedQuotes} />
      </div>
    </Section>
  );
}
