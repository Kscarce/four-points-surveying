import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { business } from "@/lib/content";
import { getQuoteRequestById, recordDecline } from "@/lib/googleSheets";
import { verifyWorkOrderToken } from "@/lib/workOrderToken";

const bodySchema = z.object({
  token: z.string().min(1),
  reason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please try again." }, { status: 400 });
  }

  const result = verifyWorkOrderToken(parsed.data.token);
  if (!result.valid) {
    const message = result.reason === "expired"
      ? "This link has expired."
      : "This link isn't valid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const quote = await getQuoteRequestById(result.quoteId);
  if (!quote) {
    return NextResponse.json({ error: "We couldn't find this quote request." }, { status: 404 });
  }
  if (quote.status === "Accepted" || quote.status === "Declined") {
    return NextResponse.json(
      { error: `This work order was already ${quote.status.toLowerCase()}.` },
      { status: 409 },
    );
  }

  const reason = parsed.data.reason || "";
  await recordDecline(result.quoteId, reason);

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.QUOTE_FROM_EMAIL;
  if (apiKey && fromAddress) {
    const resend = new Resend(apiKey);
    const notifyTo = process.env.QUOTE_NOTIFY_EMAIL || business.email;
    try {
      await resend.emails.send({
        from: fromAddress,
        to: notifyTo,
        subject: `Quote declined: ${quote.propertyAddress}`,
        text: [
          `${quote.name} declined the $${quote.price} quote for ${quote.propertyAddress}.`,
          reason ? `\nReason given: ${reason}` : "",
        ].join("\n"),
      });
    } catch (err) {
      console.error("Failed to send decline notification email:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
