// Looks up a PayPal invoice by its invoice number and returns the
// PayPal-hosted link the customer pays it at. The site never handles
// card numbers or payment details itself - we just find the right
// invoice and send the customer to PayPal's own payment page for it,
// which already supports credit card (guest checkout), PayPal
// balance, and Venmo (US) without any extra integration work here.
//
// Required env vars:
//   PAYPAL_CLIENT_ID
//   PAYPAL_CLIENT_SECRET
//   PAYPAL_ENV - "sandbox" (default) or "live"
//
// Matt creates each invoice through PayPal's own Invoicing (dashboard
// or app), and the invoice number he gives the customer on the work
// order is what gets typed into the site's "Pay an invoice" form.

export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function getApiBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken(): Promise<string> {
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

type PaypalSearchInvoice = { id: string };

type PaypalSearchResponse = {
  items?: PaypalSearchInvoice[];
  total_items?: number;
};

type PaypalInvoiceDetail = {
  detail?: {
    metadata?: {
      recipient_view_url?: string;
    };
  };
  status?: string;
};

export type InvoiceLookupResult =
  | { ok: true; payUrl: string }
  | { ok: false; reason: "not_found" | "already_paid" | "no_link" };

// Invoice numbers are set by Matt in PayPal and are plain text he
// writes on the work order, not a secret - but we still only accept
// a tight character set here to keep the PayPal query well-formed and
// to avoid passing anything unexpected through to their API.
const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9/_-]{1,25}$/;

export function isValidInvoiceNumber(value: string): boolean {
  return INVOICE_NUMBER_PATTERN.test(value.trim());
}

export async function findInvoicePayUrl(invoiceNumber: string): Promise<InvoiceLookupResult> {
  const accessToken = await getAccessToken();

  const searchRes = await fetch(`${getApiBase()}/v2/invoicing/search-invoices?page=1&page_size=2`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoice_number: invoiceNumber.trim() }),
  });

  if (!searchRes.ok) {
    throw new Error(`PayPal invoice search failed: ${searchRes.status} ${await searchRes.text()}`);
  }

  const searchJson = (await searchRes.json()) as PaypalSearchResponse;
  const match = searchJson.items?.[0];

  if (!match) {
    return { ok: false, reason: "not_found" };
  }

  const detailRes = await fetch(`${getApiBase()}/v2/invoicing/invoices/${match.id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!detailRes.ok) {
    throw new Error(`PayPal invoice detail failed: ${detailRes.status} ${await detailRes.text()}`);
  }

  const detail = (await detailRes.json()) as PaypalInvoiceDetail;

  if (detail.status === "PAID" || detail.status === "MARKED_AS_PAID") {
    return { ok: false, reason: "already_paid" };
  }

  const payUrl = detail.detail?.metadata?.recipient_view_url;
  if (!payUrl) {
    return { ok: false, reason: "no_link" };
  }

  return { ok: true, payUrl };
}
