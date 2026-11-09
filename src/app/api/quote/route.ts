import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { quoteRequestSchema } from "@/lib/quoteSchema";
import { business } from "@/lib/content";
import { generateQuotePdf } from "@/lib/generateQuotePdf";
import { appendQuoteRequestRow, isSheetsConfigured } from "@/lib/googleSheets";

// Basic in-memory rate limiting per server instance. Not a substitute
// for a real rate limiter behind a CDN, but enough to stop naive form
// spam without adding infrastructure. Resets if the server restarts.
const submissionLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form and try again.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot tripped: pretend success so the bot moves on, but don't
  // actually send anything.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const data = parsed.data;
  // Assigned here (not by the Sheet) so it exists the moment the
  // request is logged, and so the Phase 3 admin/work-order flow has a
  // stable id to look the row up by that never changes even if rows
  // get reordered or re-sorted in the Sheet later.
  const quoteId = crypto.randomUUID();

  // Log to the Google Sheet independent of whether email is configured
  // below, that way requests still get recorded even before Resend is
  // fully set up. Best effort: a Sheets failure shouldn't block the
  // customer's request or the email notification.
  if (isSheetsConfigured()) {
    try {
      await appendQuoteRequestRow(data, quoteId);
    } catch (err) {
      console.error("Failed to log quote request to Google Sheets:", err);
    }
  }

  const notifyTo = process.env.QUOTE_NOTIFY_EMAIL || business.email;
  const fromAddress = process.env.QUOTE_FROM_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !fromAddress) {
    console.error(
      "Quote request received but email isn't configured. Set RESEND_API_KEY and QUOTE_FROM_EMAIL.",
      data,
    );
    return NextResponse.json(
      {
        error:
          "Quote requests aren't wired up to email yet on this deployment. The request was logged on the server but not sent.",
      },
      { status: 503 },
    );
  }

  const resend = new Resend(apiKey);

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateQuotePdf(data);
  } catch (err) {
    // Don't let a PDF generation failure block the notification email
    // itself, Matt still needs to hear about the request either way.
    console.error("Failed to generate quote request PDF:", err);
  }

  const subject = `New quote request: ${data.surveyType} - ${data.propertyAddress}`;
  const textBody = [
    `New quote request from ${business.name} website`,
    ``,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    ``,
    `Property address: ${data.propertyAddress}`,
    data.county ? `County: ${data.county}` : null,
    `Survey type: ${data.surveyType}`,
    `Wood stakes along lines: ${data.wantsLineStakes ? "Yes" : "No (corners only)"}`,
    data.acreage ? `Approx. acreage: ${data.acreage}` : null,
    data.timeline ? `Timeline: ${data.timeline}` : null,
    ``,
    data.notes ? `Notes:\n${data.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: notifyTo,
      replyTo: data.email,
      subject,
      text: textBody,
      attachments: pdfBuffer
        ? [
            {
              filename: `quote-request-${data.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : undefined,
    });

    if (error) {
      console.error("Resend failed to send quote request email:", error);
      return NextResponse.json(
        { error: "We couldn't send your request right now. Please call or text us instead." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("Unexpected error sending quote request email:", err);
    return NextResponse.json(
      { error: "We couldn't send your request right now. Please call or text us instead." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
