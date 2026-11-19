import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { business } from "@/lib/content";
import { getQuoteRequestById, setQuotePriceAndSend } from "@/lib/googleSheets";
import { createWorkOrderToken, isWorkOrderTokenConfigured } from "@/lib/workOrderToken";
import { escapeHtml } from "@/lib/escapeHtml";

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
    // A plain-text-only email relies entirely on the recipient's mail
    // app auto-detecting the bare URL above and turning it into a tap
    // target - several mail clients/webmail providers don't do that
    // reliably, which silently strands the customer with no way to
    // accept. The HTML part below guarantees a real clickable button,
    // with the same URL repeated as plain text under it as a fallback.
    html: [
      `<p>Hi ${escapeHtml(quote.name)},</p>`,
      `<p>Here's the price for the survey you requested at ${escapeHtml(quote.propertyAddress)}: <strong>$${escapeHtml(price)}</strong>.</p>`,
      `<p>Review the details and accept or decline below:</p>`,
      `<p>`,
      `<a href="${workOrderUrl}" style="display:inline-block;padding:12px 24px;background-color:#008001;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:600;">Review your quote</a>`,
      `</p>`,
      `<p style="font-size:13px;color:#555555;">Or copy and paste this link into your browser:<br>`,
      `<a href="${workOrderUrl}">${workOrderUrl}</a></p>`,
      `<p>This link is good for 30 days. Questions? Call or text ${escapeHtml(business.team[0].name)} at ${escapeHtml(business.team[0].phone)}.</p>`,
      `<p>- ${escapeHtml(business.shortName)}</p>`,
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
