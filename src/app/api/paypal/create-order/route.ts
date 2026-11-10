import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  getApiBase,
  isPaypalConfigured,
  isValidAmount,
  isValidInvoiceNumber,
  normalizeAmount,
} from "@/lib/paypal";

const submissionLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

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
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  if (!isPaypalConfigured()) {
    return NextResponse.json({ error: "Online payment isn't set up yet on this deployment." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = body as { amount?: unknown; invoiceNumber?: unknown };
  const amount = typeof data.amount === "string" ? data.amount : String(data.amount ?? "");
  const invoiceNumber = typeof data.invoiceNumber === "string" ? data.invoiceNumber : "";

  if (!isValidAmount(amount)) {
    return NextResponse.json({ error: "Please enter a valid amount between $1 and $50,000." }, { status: 400 });
  }
  if (!isValidInvoiceNumber(invoiceNumber)) {
    return NextResponse.json({ error: "Please enter a valid invoice number." }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();

    const res = await fetch(`${getApiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            invoice_id: invoiceNumber.trim(),
            description: `Four Points Surveyors - Invoice ${invoiceNumber.trim()}`,
            amount: {
              currency_code: "USD",
              value: normalizeAmount(amount),
            },
          },
        ],
        // This is payment for a survey job, nothing physical is being
        // shipped, so tell PayPal to skip its shipping-address step
        // entirely rather than asking the customer where to ship to.
        application_context: {
          shipping_preference: "NO_SHIPPING",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("PayPal create-order failed:", res.status, errText);

      // A duplicate invoice_id is PayPal's way of saying "you've
      // already got an order referencing this invoice number" - give
      // the customer a clearer message than a generic failure.
      if (res.status === 422 && errText.includes("DUPLICATE_INVOICE_ID")) {
        return NextResponse.json(
          { error: "A payment for that invoice number may already be in progress. Please contact us if you're unsure." },
          { status: 409 },
        );
      }

      return NextResponse.json({ error: "We couldn't start that payment. Please try again." }, { status: 502 });
    }

    const order = (await res.json()) as { id: string };
    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error("PayPal create-order error:", err);
    return NextResponse.json({ error: "We couldn't reach PayPal right now. Please try again in a moment." }, { status: 502 });
  }
}
