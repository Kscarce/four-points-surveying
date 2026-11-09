import crypto from "crypto";

// Lightweight shared-password auth for the /admin area. There's one
// user (Matt, maybe Kaylee), so a single password rather than real
// accounts is the right amount of complexity here. The session cookie
// is an HMAC-signed value (not just "true"), so it can't be forged by
// guessing the cookie's contents without the server secret.
//
// Required env vars:
//   ADMIN_PASSWORD         - the shared password for the /admin area
//   ADMIN_SESSION_SECRET   - any long random string, used to sign the
//                            session cookie. Generate one with:
//                            `openssl rand -hex 32`

export const ADMIN_COOKIE_NAME = "fp_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET isn't configured.");
  return secret;
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Constant-time comparison so response timing can't leak the
  // correct password character by character.
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken(): { token: string; maxAge: number } {
  const issuedAt = Date.now().toString();
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(issuedAt)
    .digest("hex");
  return { token: `${issuedAt}.${signature}`, maxAge: SESSION_MAX_AGE_SECONDS };
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(issuedAt)
    .digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age < SESSION_MAX_AGE_SECONDS * 1000;
}
