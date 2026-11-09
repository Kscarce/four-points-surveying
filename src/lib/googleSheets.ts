import { google } from "googleapis";
import type { QuoteRequest, StoredQuoteRequest } from "./quoteSchema";

// Logs every quote request to a Google Sheet, so Matt has a running,
// editable record of requests (and can set a price / status on each
// one by just typing into the Sheet) without needing a custom admin
// page. Uses a Google Cloud "service account" - a credential that's
// independent of any one person's Google login, which is what lets
// this point at whichever Sheet (Kaylee's for now, Matt's later) is
// shared with it, without any code changes.
//
// Required env vars:
//   GOOGLE_SHEET_ID               - the long id in the Sheet's URL,
//                                    between /d/ and /edit
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  - the service account's email
//                                    (client_email in its JSON key)
//   GOOGLE_SERVICE_ACCOUNT_KEY    - the service account's private key
//                                    (private_key in its JSON key),
//                                    with literal "\n" line breaks as
//                                    environment variables can't hold
//                                    real newlines
//
// If any of these aren't set, this is treated as "not configured yet"
// rather than an error: the Sheet is an enhancement on top of the
// email notification, not a requirement for the quote form to work.
export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  );
}

// Column order. Row 1 of the Sheet should have these exact headers,
// in this exact order - everything else in this file assumes it.
const COLUMNS = [
  "Timestamp",
  "Status",
  "Name",
  "Phone",
  "Email",
  "Property Address",
  "County",
  "Survey Type",
  "Wood Stakes Along Lines",
  "Acreage",
  "Timeline",
  "Notes",
  "Price",
  "Work Order Sent",
  "Quote ID",
  "Signed By",
  "Signed At",
  "Signed IP",
  "Decline Reason",
] as const;

const SHEET_RANGE = `Sheet1!A:${String.fromCharCode(64 + COLUMNS.length)}`; // A:S

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) {
    throw new Error("Google Sheets isn't configured.");
  }
  return new google.auth.JWT({
    email,
    // Env vars can't hold real newlines, so the key is stored with
    // literal "\n" sequences and converted back here.
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId(): string {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Google Sheets isn't configured.");
  return sheetId;
}

export async function appendQuoteRequestRow(
  data: QuoteRequest,
  quoteId: string,
): Promise<void> {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  const row = [
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }), // Timestamp
    "New", // Status
    data.name,
    data.phone,
    data.email,
    data.propertyAddress,
    data.county ?? "",
    data.surveyType,
    data.wantsLineStakes ? "Yes" : "No",
    data.acreage ?? "",
    data.timeline ?? "",
    data.notes ?? "",
    "", // Price - Matt fills this in
    "", // Work Order Sent
    quoteId,
    "", // Signed By
    "", // Signed At
    "", // Signed IP
    "", // Decline Reason
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: SHEET_RANGE,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

function rowToStoredQuoteRequest(row: string[]): StoredQuoteRequest {
  const get = (name: (typeof COLUMNS)[number]) => row[COLUMNS.indexOf(name)] ?? "";
  return {
    timestamp: get("Timestamp"),
    status: get("Status"),
    name: get("Name"),
    phone: get("Phone"),
    email: get("Email"),
    propertyAddress: get("Property Address"),
    county: get("County"),
    surveyType: get("Survey Type") as QuoteRequest["surveyType"],
    wantsLineStakes: get("Wood Stakes Along Lines") === "Yes",
    acreage: get("Acreage"),
    timeline: get("Timeline"),
    notes: get("Notes"),
    price: get("Price"),
    workOrderSent: get("Work Order Sent"),
    quoteId: get("Quote ID"),
    signedByName: get("Signed By"),
    signedAt: get("Signed At"),
    signedIp: get("Signed IP"),
    declineReason: get("Decline Reason"),
    company: "",
  };
}

// Returns every logged quote request with its 0-indexed row number in
// the Sheet (row 0 = the first data row, right under the header),
// which the update functions below need to target a specific row.
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

export async function getOpenQuoteRequests(): Promise<StoredQuoteRequest[]> {
  const rows = await getAllRows();
  return rows
    .map(({ row }) => rowToStoredQuoteRequest(row))
    .filter((q) => q.quoteId && (q.status === "New" || q.status === "Quoted"));
}

// Accepted (signed) quote requests — these are real, paid-up jobs, so
// this is what the schedule's "Job / customer" dropdown is built from.
export async function getAcceptedQuoteRequests(): Promise<StoredQuoteRequest[]> {
  const rows = await getAllRows();
  return rows
    .map(({ row }) => rowToStoredQuoteRequest(row))
    .filter((q) => q.quoteId && q.status === "Accepted");
}

export async function getQuoteRequestById(
  quoteId: string,
): Promise<StoredQuoteRequest | null> {
  const rows = await getAllRows();
  const match = rows.find(({ row }) => row[COLUMNS.indexOf("Quote ID")] === quoteId);
  return match ? rowToStoredQuoteRequest(match.row) : null;
}

async function updateRowByQuoteId(
  quoteId: string,
  updates: Partial<Record<(typeof COLUMNS)[number], string>>,
): Promise<void> {
  const rows = await getAllRows();
  const match = rows.find(({ row }) => row[COLUMNS.indexOf("Quote ID")] === quoteId);
  if (!match) throw new Error(`No quote request found with id ${quoteId}`);

  const sheets = google.sheets({ version: "v4", auth: getAuth() });
  const sheetRowNumber = match.rowIndex + 2; // +1 for header, +1 for 1-indexing

  const data = Object.entries(updates).map(([column, value]) => {
    const colIndex = COLUMNS.indexOf(column as (typeof COLUMNS)[number]);
    const colLetter = String.fromCharCode(65 + colIndex);
    return {
      range: `Sheet1!${colLetter}${sheetRowNumber}`,
      values: [[value]],
    };
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: getSheetId(),
    requestBody: { valueInputOption: "USER_ENTERED", data },
  });
}

export async function setQuotePriceAndSend(quoteId: string, price: string): Promise<void> {
  await updateRowByQuoteId(quoteId, {
    Price: price,
    Status: "Quoted",
    "Work Order Sent": "Yes",
  });
}

export async function recordAcceptance(
  quoteId: string,
  signedByName: string,
  signedIp: string,
): Promise<void> {
  await updateRowByQuoteId(quoteId, {
    Status: "Accepted",
    "Signed By": signedByName,
    "Signed At": new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
    "Signed IP": signedIp,
  });
}

export async function recordDecline(quoteId: string, reason: string): Promise<void> {
  await updateRowByQuoteId(quoteId, {
    Status: "Declined",
    "Decline Reason": reason,
  });
}
