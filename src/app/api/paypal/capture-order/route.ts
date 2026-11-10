import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getAccessToken, getApiBase, isPaypalConfigured } from "@/lib/paypal";
import { business } from "@/lib/content";

type CaptureResponse = {
  status?: string;
  purchase_units?: Array<{
    invoice_id?: string;
    payments?: {
      captures?: Array<{
        id: string;
        amount?: { value: string; currency_code: string };
      }>;
    };
  }>;
  payer?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
};

async function notifyMattOfPayment(capture: CaptureResponse) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !fromAddress) return; // Email is an enhancement here, not required.

  const unit = capture.purchase_units?.[0];
  const paymentCapture = unit?.payments?.captures?.[0];
  const payerName = [capture.payer?.name?.given_name, capture.payer?.name?.surname]
    .filter(Boolean)
    .join(" ");

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: fromAddress,
      to: process.env.QUOTE_NOTIFY_EMAIL || business.email,
      subject: `Payment received${unit?.invoice_id ? ` - Invoice ${unit.invoice_id}` : ""}`,
      text: [
        `A payment came in through the website.`,
        ``,
        unit?.invoice_id ? `Invoice number: ${unit.invoice_id}` : null,
        paymentCapture?.amount
          ? `Amount: $${paymentCapture.amount.value} ${paymentCapture.amount.currency_code}`
          : null,
        payerName ? `From: ${payerName}` : null,
        capture.payer?.email_address ? `Payer email: ${capture.payer.email_address}` : null,
        paymentCapture?.id ? `PayPal transaction ID: ${paymentCapture.id}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch (err) {
    // Don't fail the payment response over a notification email issue,
    // the money already moved, this is just a heads-up to Matt.
    console.error("Failed to send payment notification email:", err);
  }
}

export async function POST(request: NextRequest) {
  if (!isPaypalConfigured()) {
    return NextResponse.json({ error: "Online payment isn't set up yet on this deployment." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const orderId = typeof (body as { orderId?: unknown })?.orderId === "string"
    ? (body as { orderId: string }).orderId
    : "";

  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();

    const res = await fetch(`${getApiBase()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const result = (await res.json()) as CaptureResponse;

    if (!res.ok) {
      console.error("PayPal capture failed:", res.status, result);
      return NextResponse.json(
        { error: "We couldn't complete that payment. You have not been charged. Please try again or contact us." },
        { status: 502 },
      );
    }

    if (result.status !== "COMPLETED") {
      console.error("PayPal capture returned unexpected status:", result.status, result);
      return NextResponse.json(
        { error: "Your payment didn't complete. Please try again or contact us." },
        { status: 502 },
      );
    }

    await notifyMattOfPayment(result);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PayPal capture-order error:", err);
    return NextResponse.json(
      { error: "We couldn't reach PayPal right now. If you were charged, please contact us so we can confirm." },
      { status: 502 },
    );
  }
}
