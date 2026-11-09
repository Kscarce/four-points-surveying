import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { business } from "@/lib/content";
import { getQuoteRequestById, setQuotePriceAndSend } from "@/lib/googleSheets";
import { createWorkOrderToken, isWorkOrderTokenConfigured } from "@/lib/workOrderToken";

const bodySchema = z.object({
  quoteId: z.string().min(1),
  price: z.string().trim().min(1, "Enter a price").max(50),
});

export async function POST(request: NextRequest) {
  if (!isWorkOrderTokenConfigured()) {
    return NextResponse.json(
      { error: "WORK_ORDER_TOKEN_SECRET isn't configured on this deployment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }
  const { quoteId, price } = parsed.data;

  const quote = await getQuoteRequestById(quoteId);
  if (!quote) {
    return NextResponse.json({ error: "Quote request not found." }, { status: 404 });
  }

  await setQuotePriceAndSend(quoteId, price);

  const token = createWorkOrderToken(quoteId);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const workOrderUrl = `${baseUrl}/work-order/${token}`;

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.QUOTE_FROM_EMAIL;
  if (!apiKey || !fromAddress) {
    return NextResponse.json(
      {
        ok: true,
        warning: "Price saved, but email isn't configured so the customer wasn't notified.",
        workOrderUrl,
      },
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromAddress,
    to: quote.email,
    subject: `Your ${business.shortName} quote: $${price}`,
    text: [
      `Hi ${quote.name},`,
      ``,
      `Here's the price for the survey you requested at ${quote.propertyAddress}: $${price}.`,
      ``,
      `Review the details and accept or decline here:`,
      workOrderUrl,
      ``,
      `This link is good for 30 days. Questions? Call or text ${business.team[0].name} at ${business.team[0].phone}.`,
      ``,
      `- ${business.shortName}`,
    ].join("\n"),
  });

  if (error) {
    console.error("Resend failed to send work order email:", error);
    return NextResponse.json(
      { ok: true, warning: "Price saved, but the notification email failed to send.", workOrderUrl },
    );
  }

  return NextResponse.json({ ok: true, workOrderUrl });
}
