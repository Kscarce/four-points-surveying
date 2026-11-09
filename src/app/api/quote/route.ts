import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { quoteRequestSchema } from "@/lib/quoteSchema";
import { business } from "@/lib/content";

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
