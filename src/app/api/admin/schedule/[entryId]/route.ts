import { NextRequest, NextResponse } from "next/server";
import { scheduleEntrySchema } from "@/lib/scheduleSchema";
import {
  deleteScheduleEntry,
  isScheduleConfigured,
  updateScheduleEntry,
} from "@/lib/scheduleSheets";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  if (!isScheduleConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  const { entryId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = scheduleEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await updateScheduleEntry(entryId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update schedule entry", error);
    return NextResponse.json({ error: "Couldn't save those changes." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  if (!isScheduleConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  const { entryId } = await params;

  try {
    await deleteScheduleEntry(entryId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete schedule entry", error);
    return NextResponse.json({ error: "Couldn't delete that job." }, { status: 500 });
  }
}
