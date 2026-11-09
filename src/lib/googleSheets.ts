import { google } from "googleapis";
import type { QuoteRequest } from "./quoteSchema";

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

export async function appendQuoteRequestRow(data: QuoteRequest): Promise<void> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!sheetId || !email || !key) {
    throw new Error(
      "Google Sheets isn't configured (missing GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_SERVICE_ACCOUNT_KEY).",
    );
  }

  const auth = new google.auth.JWT({
    email,
    // Env vars can't hold real newlines, so the key is stored with
    // literal "\n" sequences and converted back here.
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

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
    "", // Work Order Sent - filled in once Phase 3's accept flow sends it
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:N",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}
