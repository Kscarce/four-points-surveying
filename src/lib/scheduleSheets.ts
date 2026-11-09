import { google } from "googleapis";
import type { ScheduleEntry, ScheduleEntryInput } from "./scheduleSchema";

// Job scheduling for the crew (Matt/Jon/Jerrett), stored as its own
// "Schedule" tab in the same Google Sheet the quote requests use.
// Entries are entered by hand (jobs get scheduled based on where crew
// already are that day, not automatically from a quote), so this is
// deliberately just a thin read/write layer over the Sheet rather than
// anything smarter.
//
// Reuses the same GOOGLE_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL /
// GOOGLE_SERVICE_ACCOUNT_KEY env vars as src/lib/googleSheets.ts.

export function isScheduleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  );
}

const COLUMNS = [
  "Entry ID",
  "Date",
  "Time",
  "Job / Customer",
  "County",
  "Assigned Worker",
  "Location",
  "Notes",
] as const;

const SHEET_RANGE = `Schedule!A:${String.fromCharCode(64 + COLUMNS.length)}`; // A:H

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) {
    throw new Error("Google Sheets isn't configured.");
  }
  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Google Sheets isn't configured.");
  return sheetId;
}

function rowToScheduleEntry(row: string[]): ScheduleEntry {
  const get = (name: (typeof COLUMNS)[number]) => row[COLUMNS.indexOf(name)] ?? "";
  return {
    entryId: get("Entry ID"),
    date: get("Date"),
    time: get("Time"),
    job: get("Job / Customer"),
    county: get("County"),
    worker: (get("Assigned Worker") || "Unassigned") as ScheduleEntry["worker"],
    location: get("Location"),
    notes: get("Notes"),
  };
}

async function getAllRows(): Promise<{ row: string[]; rowIndex: number }[]> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: SHEET_RANGE,
  });
  const values = data.values ?? [];
  // Skip the header row.
  return values.slice(1).map((row, i) => ({ row: row as string[], rowIndex: i }));
}

export async function getScheduleEntries(): Promise<ScheduleEntry[]> {
  const rows = await getAllRows();
  return rows
    .map(({ row }) => rowToScheduleEntry(row))
    .filter((entry) => entry.entryId && entry.date);
}

export async function createScheduleEntry(
  data: ScheduleEntryInput,
): Promise<ScheduleEntry> {
  const entryId = crypto.randomUUID();
  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  const row = [
    entryId,
    data.date,
    data.time ?? "",
    data.job,
    data.county ?? "",
    data.worker,
    data.location ?? "",
    data.notes ?? "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return {
    entryId,
    ...data,
    time: data.time ?? "",
    county: data.county ?? "",
    location: data.location ?? "",
    notes: data.notes ?? "",
  };
}

export async function updateScheduleEntry(
  entryId: string,
  data: ScheduleEntryInput,
): Promise<void> {
  const rows = await getAllRows();
  const match = rows.find(({ row }) => row[COLUMNS.indexOf("Entry ID")] === entryId);
  if (!match) throw new Error(`No schedule entry found with id ${entryId}`);

  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const sheetRowNumber = match.rowIndex + 2; // +1 for header, +1 for 1-indexing

  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `Schedule!B${sheetRowNumber}:H${sheetRowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        data.date,
        data.time ?? "",
        data.job,
        data.county ?? "",
        data.worker,
        data.location ?? "",
        data.notes ?? "",
      ]],
    },
  });
}

export async function deleteScheduleEntry(entryId: string): Promise<void> {
  const rows = await getAllRows();
  const match = rows.find(({ row }) => row[COLUMNS.indexOf("Entry ID")] === entryId);
  if (!match) throw new Error(`No schedule entry found with id ${entryId}`);

  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  // Need the actual sheetId (not spreadsheetId) for a deleteDimension
  // request, since that's a grid operation scoped to one tab.
  const { data: spreadsheet } = await sheets.spreadsheets.get({
    spreadsheetId: getSheetId(),
    fields: "sheets.properties",
  });
  const scheduleSheet = spreadsheet.sheets?.find(
    (s) => s.properties?.title === "Schedule",
  );
  const sheetId = scheduleSheet?.properties?.sheetId;
  if (sheetId === undefined) throw new Error("Schedule tab not found.");

  const sheetRowNumber = match.rowIndex + 2; // 1-indexed row in the grid
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: sheetRowNumber - 1,
              endIndex: sheetRowNumber,
            },
          },
        },
      ],
    },
  });
}
