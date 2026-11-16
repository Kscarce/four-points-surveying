import { NextRequest, NextResponse } from "next/server";
import { getQuoteRequestById, markQuoteCompleted } from "@/lib/googleSheets";
import { getScheduleEntries, isScheduleConfigured } from "@/lib/scheduleSheets";

// Runs on a schedule (see vercel.json) to auto-mark a quote "Completed"
// once its linked schedule entry's date has passed. Only touches quotes
// still sitting in "Accepted" status, so a job Matt already marked
// Completed (or Declined, somehow) by hand is never clobbered.
//
// Vercel calls scheduled cron requests with
// `Authorization: Bearer ${CRON_SECRET}` automatically, so this route
// isn't under /api/admin - it checks that header itself instead of the
// admin-session cookie.

function todayInBusinessTimezone(): string {
  // en-CA gives YYYY-MM-DD directly, which is also what the sheet's
  // Date column and the schedule form both use.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!isScheduleConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const today = todayInBusinessTimezone();

  try {
    const entries = await getScheduleEntries();

    // A quote can have more than one schedule entry (multiple visits for
    // the same job); only process each quoteId once.
    const pastQuoteIds = new Set(
      entries
        .filter((e) => e.quoteId && e.date && e.date < today)
        .map((e) => e.quoteId!),
    );

    const completed: string[] = [];
    const skipped: string[] = [];

    for (const quoteId of pastQuoteIds) {
      const quote = await getQuoteRequestById(quoteId);
      if (!quote) {
        skipped.push(quoteId);
        continue;
      }
      if (quote.status !== "Accepted") {
        // Already Completed, Declined, or otherwise moved on - leave it.
        skipped.push(quoteId);
        continue;
      }
      await markQuoteCompleted(quoteId);
      completed.push(quoteId);
    }

    return NextResponse.json({ ok: true, today, completed, skipped });
  } catch (error) {
    console.error("complete-past-jobs cron failed", error);
    return NextResponse.json({ error: "Cron run failed." }, { status: 500 });
  }
}
