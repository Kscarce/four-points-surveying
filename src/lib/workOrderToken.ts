import crypto from "crypto";

// A stateless, signed link for the customer-facing accept/decline
// page. No database to look tokens up in, so the token carries its
// own payload (quoteId + expiry) and a signature that proves Matt's
// server issued it and it hasn't been tampered with. The actual quote
// details and price are re-read from the Sheet by quoteId when the
// link is opened, so the Sheet (not the token) is always the source
// of truth for what the customer sees.
//
// Required env var:
//   WORK_ORDER_TOKEN_SECRET - any long random string, used to sign
//                             these links. Generate one with:
//                             `openssl rand -hex 32`

const LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.WORK_ORDER_TOKEN_SECRET;
  if (!secret) throw new Error("WORK_ORDER_TOKEN_SECRET isn't configured.");
  return secret;
}

export function isWorkOrderTokenConfigured(): boolean {
  return Boolean(process.env.WORK_ORDER_TOKEN_SECRET);
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function createWorkOrderToken(quoteId: string): string {
  const payload = JSON.stringify({ quoteId, exp: Date.now() + LINK_LIFETIME_MS });
  const encodedPayload = base64url(payload);
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export type WorkOrderTokenResult =
  | { valid: true; quoteId: string }
  | { valid: false; reason: "malformed" | "invalid-signature" | "expired" };

export function verifyWorkOrderToken(token: string): WorkOrderTokenResult {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return { valid: false, reason: "malformed" };

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: "invalid-signature" };
  }

  let payload: { quoteId?: string; exp?: number };
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }

  if (!payload.quoteId || !payload.exp) return { valid: false, reason: "malformed" };
  if (Date.now() > payload.exp) return { valid: false, reason: "expired" };

  return { valid: true, quoteId: payload.quoteId };
}
