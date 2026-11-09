import { NextRequest, NextResponse } from "next/server";
import { scheduleEntrySchema } from "@/lib/scheduleSchema";
import {
  createScheduleEntry,
  getScheduleEntries,
  isScheduleConfigured,
} from "@/lib/scheduleSheets";

// Auth is already handled by src/proxy.ts for every /api/admin/* route,
// so these handlers can assume the caller is signed in.

export async function GET() {
  if (!isScheduleConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  try {
    const entries = await getScheduleEntries();
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to load schedule entries", error);
    return NextResponse.json({ error: "Couldn't load the schedule." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isScheduleConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = scheduleEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const entry = await createScheduleEntry(parsed.data);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to create schedule entry", error);
    return NextResponse.json({ error: "Couldn't save that job." }, { status: 500 });
  }
}
