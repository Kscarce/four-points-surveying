import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { StoredQuoteRequest } from "./quoteSchema";
import { business } from "./content";

// Generates the signed work order PDF: the original quote details,
// the price Matt set, and the customer's e-signature record. This is
// what replaces the old hand-filled work_order_sheet_2024.pdf - once
// a customer accepts, this document IS the work order, built entirely
// from data already on file rather than retyped.

const PAGE_MARGIN = 54;
const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;

type Row = { label: string; value: string };

function buildRows(data: StoredQuoteRequest): Row[] {
  const rows: Row[] = [
    { label: "Name", value: data.name },
    { label: "Phone", value: data.phone },
    { label: "Email", value: data.email },
    { label: "Property address", value: data.propertyAddress },
  ];
  if (data.county) rows.push({ label: "County", value: data.county });
  rows.push({ label: "Type of survey", value: data.surveyType });
  rows.push({
    label: "Wood stakes along lines",
    value: data.wantsLineStakes ? "Yes" : "No (corners only)",
  });
  if (data.acreage) rows.push({ label: "Approx. acreage", value: data.acreage });
  if (data.timeline) rows.push({ label: "Timeline", value: data.timeline });
  if (data.notes) rows.push({ label: "Notes", value: data.notes });
  return rows;
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateWorkOrderPdf(data: StoredQuoteRequest): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  let y = PAGE_HEIGHT - PAGE_MARGIN;

  function ensureSpace(linesNeeded: number, lineHeight: number) {
    if (y - linesNeeded * lineHeight < PAGE_MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - PAGE_MARGIN;
    }
  }

  function drawLabelValue(label: string, value: string, labelSize = 9, valueSize = 11) {
    const lineHeight = 14;
    const valueLines = wrapText(value, font, valueSize, contentWidth);
    ensureSpace(valueLines.length + 1, lineHeight);
    page.drawText(label.toUpperCase(), {
      x: PAGE_MARGIN,
      y,
      size: labelSize,
      font: boldFont,
      color: rgb(0, 0.3, 0),
    });
    y -= lineHeight;
    for (const line of valueLines) {
      page.drawText(line, { x: PAGE_MARGIN, y, size: valueSize, font, color: rgb(0.05, 0.05, 0.05) });
      y -= lineHeight;
    }
    y -= 8;
  }

  // Header
  page.drawText(business.name, {
    x: PAGE_MARGIN,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0.25, 0),
  });
  y -= 22;
  page.drawText("Signed work order", {
    x: PAGE_MARGIN,
    y,
    size: 12,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 10;
  page.drawLine({
    start: { x: PAGE_MARGIN, y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 1,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 24;

  for (const row of buildRows(data)) {
    drawLabelValue(row.label, row.value);
  }

  // Price, called out distinctly from the rest of the fields.
  ensureSpace(3, 16);
  page.drawLine({
    start: { x: PAGE_MARGIN, y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 22;
  page.drawText("AGREED PRICE", { x: PAGE_MARGIN, y, size: 10, font: boldFont, color: rgb(0, 0.3, 0) });
  y -= 20;
  page.drawText(`$${data.price}`, { x: PAGE_MARGIN, y, size: 20, font: boldFont, color: rgb(0.05, 0.05, 0.05) });
  y -= 30;

  // Signature block - this is the e-signature audit trail: who agreed,
  // when, and the IP address it came from, satisfying UETA/ESIGN's
  // attribution requirement.
  ensureSpace(6, 16);
  page.drawLine({
    start: { x: PAGE_MARGIN, y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 22;
  page.drawText("ELECTRONIC SIGNATURE", { x: PAGE_MARGIN, y, size: 10, font: boldFont, color: rgb(0, 0.3, 0) });
  y -= 18;
  const agreementText =
    `"I have reviewed the details and price above and agree to them." - electronically signed by ${data.signedByName}`;
  for (const line of wrapText(agreementText, font, 10, contentWidth)) {
    page.drawText(line, { x: PAGE_MARGIN, y, size: 10, font, color: rgb(0.05, 0.05, 0.05) });
    y -= 14;
  }
  y -= 4;
  page.drawText(`Signed: ${data.signedAt}`, { x: PAGE_MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 13;
  page.drawText(`IP address: ${data.signedIp}`, { x: PAGE_MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 13;
  page.drawText(`Quote ID: ${data.quoteId}`, { x: PAGE_MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
