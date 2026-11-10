// Lets a customer pay Matt directly from the site: they type in the
// amount their emailed PDF invoice says they owe and that invoice's
// number (kept only as a reference note, not matched against
// anything), then pay by PayPal, Venmo, or a card entered right on
// the page. This uses PayPal's standard Checkout (Orders API), not
// the separate Invoicing product, since Matt doesn't create invoices
// inside PayPal itself, he just emails a PDF and customers used to
// have to go send him money manually.
//
// Required env vars:
//   PAYPAL_CLIENT_ID              - also exposed to the browser as
//                                    NEXT_PUBLIC_PAYPAL_CLIENT_ID
//                                    (Client IDs aren't secret, the
//                                    PayPal JS SDK needs one client-side)
//   PAYPAL_CLIENT_SECRET          - server-only, never exposed
//   PAYPAL_ENV                    - "sandbox" (default) or "live"

export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function getApiBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PayPal isn't configured.");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

// Matt writes this on the PDF invoice he emails, it's just a
// reference note attached to the PayPal order (shows up on his
// PayPal transaction so he can match the payment to the invoice),
// not looked up or verified against anything.
const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9/_-]{1,25}$/;

export function isValidInvoiceNumber(value: string): boolean {
  return INVOICE_NUMBER_PATTERN.test(value.trim());
}

// Accepts a decimal amount with up to 2 decimal places, e.g. "450" or
// "450.50". Matt's invoices are for survey jobs, not micropayments or
// huge contracts, so a sane range keeps out typos (an extra zero) and
// placeholder/test values.
export function isValidAmount(value: string): boolean {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value.trim())) return false;
  const n = Number(value);
  return n >= 1 && n <= 50000;
}

export function normalizeAmount(value: string): string {
  return Number(value).toFixed(2);
}
