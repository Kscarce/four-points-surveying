import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { business } from "@/lib/content";
import { generateWorkOrderPdf } from "@/lib/generateWorkOrderPdf";
import { getQuoteRequestById, recordAcceptance } from "@/lib/googleSheets";
import { verifyWorkOrderToken } from "@/lib/workOrderToken";

const bodySchema = z.object({
  token: z.string().min(1),
  signedByName: z.string().trim().min(2, "Enter your full name").max(200),
  agree: z.literal(true, { message: "You must check the agreement box." }),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 400 },
    );
  }

  const result = verifyWorkOrderToken(parsed.data.token);
  if (!result.valid) {
    const message = result.reason === "expired"
      ? "This link has expired. Ask us to resend it."
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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const signedAt = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  await recordAcceptance(result.quoteId, parsed.data.signedByName, ip);

  const signedQuote = {
    ...quote,
    signedByName: parsed.data.signedByName,
    signedAt,
    signedIp: ip,
  };

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateWorkOrderPdf(signedQuote);
  } catch (err) {
    console.error("Failed to generate signed work order PDF:", err);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.QUOTE_FROM_EMAIL;
  if (apiKey && fromAddress) {
    const resend = new Resend(apiKey);
    const attachments = pdfBuffer
      ? [{ filename: "signed-work-order.pdf", content: pdfBuffer, contentType: "application/pdf" }]
      : undefined;
    const notifyTo = process.env.QUOTE_NOTIFY_EMAIL || business.email;

    try {
      await resend.emails.send({
        from: fromAddress,
        to: [quote.email, notifyTo],
        subject: `Work order accepted: ${quote.propertyAddress}`,
        text: [
          `${parsed.data.signedByName} accepted the $${quote.price} work order for ${quote.propertyAddress}.`,
          ``,
          `A copy of the signed work order is attached.`,
        ].join("\n"),
        attachments,
      });
    } catch (err) {
      console.error("Failed to send signed work order email:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
