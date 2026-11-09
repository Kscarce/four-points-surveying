import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { QuoteRequest } from "./quoteSchema";
import { business } from "./content";

// Generates a one-page PDF summary of a quote request, for Matt's
// notification email. Deliberately simple (pdf-lib, no HTML-to-PDF
// browser step) since this just needs to be a clean, readable,
// printable snapshot of what the customer submitted, not a styled
// document. The Phase 3 work order generator is a separate,
// template-driven piece built later.

const PAGE_MARGIN = 54;
const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;

type Row = { label: string; value: string };

function buildRows(data: QuoteRequest): Row[] {
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

// Simple word-wrap for a monospace-free font at a fixed width.
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

export async function generateQuotePdf(data: QuoteRequest): Promise<Buffer> {
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

  // Header
  page.drawText(business.name, {
    x: PAGE_MARGIN,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0, 0.25, 0),
  });
  y -= 22;
  page.drawText("New quote request", {
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

  const labelSize = 9;
  const valueSize = 11;
  const lineHeight = 14;

  for (const row of buildRows(data)) {
    const valueLines = wrapText(row.value, font, valueSize, contentWidth);
    ensureSpace(valueLines.length + 1, lineHeight);

    page.drawText(row.label.toUpperCase(), {
      x: PAGE_MARGIN,
      y,
      size: labelSize,
      font: boldFont,
      color: rgb(0, 0.3, 0),
    });
    y -= lineHeight;

    for (const line of valueLines) {
      page.drawText(line, {
        x: PAGE_MARGIN,
        y,
        size: valueSize,
        font,
        color: rgb(0.05, 0.05, 0.05),
      });
      y -= lineHeight;
    }
    y -= 8;
  }

  ensureSpace(2, lineHeight);
  page.drawLine({
    start: { x: PAGE_MARGIN, y },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 18;
  page.drawText(`Submitted ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`, {
    x: PAGE_MARGIN,
    y,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
