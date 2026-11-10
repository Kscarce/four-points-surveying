import { NextRequest, NextResponse } from "next/server";
import { findInvoicePayUrl, isPaypalConfigured, isValidInvoiceNumber } from "@/lib/paypal";

// Basic in-memory rate limiting per server instance, same approach as
// /api/quote - not a substitute for a real rate limiter, but enough
// to stop someone from hammering PayPal's API through this endpoint.
const submissionLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  timestamps.push(now);
  submissionLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

const NOT_FOUND_MESSAGE =
  "We couldn't find an invoice with that number. Double check it against your work order, or contact us if you think this is a mistake.";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  if (!isPaypalConfigured()) {
    return NextResponse.json(
      { error: "Online invoice payment isn't set up yet on this deployment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const invoiceNumber =
    typeof body === "object" && body !== null && "invoiceNumber" in body
      ? String((body as { invoiceNumber: unknown }).invoiceNumber ?? "")
      : "";

  if (!isValidInvoiceNumber(invoiceNumber)) {
    return NextResponse.json(
      { error: "Please enter a valid invoice number." },
      { status: 400 },
    );
  }

  try {
    const result = await findInvoicePayUrl(invoiceNumber);

    if (!result.ok) {
      if (result.reason === "already_paid") {
        return NextResponse.json(
          { error: "That invoice is already marked as paid. Contact us if that doesn't look right." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ payUrl: result.payUrl });
  } catch (err) {
    console.error("PayPal invoice lookup failed:", err);
    return NextResponse.json(
      { error: "We couldn't reach PayPal right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
