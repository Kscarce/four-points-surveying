# Four Points Surveyors

A rebuild of the website for Four Points Surveyors, PLLC, a land
surveying company serving the Piedmont Triad region of North
Carolina. Replaces the previous Weebly-based site with a modern,
mobile-friendly site and an automated quote request flow.

## Status

Phase 1 (public site + quote request form) and Phase 3 (quote-to-work-order
automation) are both in place. See `PLAN.md` for the full phased plan.

This has **not replaced the live site yet**. It's being built and
reviewed here first; `4ptss.com` still points at the old Weebly site
until that switch is made deliberately.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- Tailwind CSS 4
- [Resend](https://resend.com/) for sending quote request emails
- [Zod](https://zod.dev/) for form validation (shared client/server)
- Self-hosted fonts via `@fontsource` (Public Sans, Oswald),
  not Google Fonts, since the build environment this was developed in
  couldn't reach `fonts.googleapis.com`. Works fine either way, but
  worth knowing if fonts ever need to change.
- Brand palette and typeface pairing are built around the client's
  real logo (`public/brand/logo-mark.jpg`), colors sampled directly
  from the file rather than guessed.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables (quote request emails)

The quote request form (`/contact`) posts to `/api/quote`, which sends
an email via Resend. Without these set, the form still works and
validates input, but submissions will fail with a clear "not
configured" error instead of silently disappearing:

```bash
# .env.local
RESEND_API_KEY=your_resend_api_key
QUOTE_FROM_EMAIL="Four Points Surveyors <quotes@yourdomain.com>"
QUOTE_NOTIFY_EMAIL=the-real-inbox-to-receive-requests@example.com
```

`QUOTE_FROM_EMAIL` needs to be on a domain verified in Resend. `QUOTE_NOTIFY_EMAIL`
is where new quote requests land, if unset it falls back to
`business.email` in `src/lib/content.ts` (`matt@4ptss.com`).

## Google Sheets logging (optional)

Separate from email, every quote request can also be logged as a row
in a Google Sheet (status, price, etc. are columns Matt can fill in by
hand — this is what Phase 3's accept flow reads from). This is
optional: without it configured, the form still works exactly as
above, just without the Sheet row.

```bash
# .env.local
GOOGLE_SHEET_ID=the_id_from_the_sheets_url
GOOGLE_SERVICE_ACCOUNT_EMAIL=something@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

How to get these three values:

1. In [Google Cloud Console](https://console.cloud.google.com), create
   a project, then enable the **Google Sheets API** for it.
2. Create a **service account** (IAM & Admin → Service Accounts). This
   is a robot identity, independent of any one person's Google
   login — that's what lets the Sheet later be swapped from a
   development one to Matt's real one without touching any code, by
   just sharing the new Sheet with the same service account.
3. Generate a **JSON key** for it (Keys tab → Add key → JSON). Open
   the downloaded file:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` is its `client_email` field.
   - `GOOGLE_SERVICE_ACCOUNT_KEY` is its `private_key` field, exactly
     as written (the `\n` sequences in it are literal, keep them).
4. Create a Google Sheet, **share it with that service account's
   email as an Editor** (same as sharing with a person), and copy the
   long ID out of its URL (between `/d/` and `/edit`) into
   `GOOGLE_SHEET_ID`.
5. Row 1 should have these column headers, in order: `Timestamp`,
   `Status`, `Name`, `Phone`, `Email`, `Property Address`, `County`,
   `Survey Type`, `Wood Stakes Along Lines`, `Acreage`, `Timeline`,
   `Notes`, `Price`, `Work Order Sent`.

A development Sheet (Kaylee's own account) was created this way while
building this. Switching to Matt's own Sheet later is just steps 4-5
again on his account, then updating `GOOGLE_SHEET_ID` — no code
changes.

**Never commit the service account's JSON key or its private key value
to git.** It only belongs in `.env.local` (already gitignored) and in
Vercel's environment variable settings.

## Quote-to-work-order automation (Phase 3)

Replaces Matt's old hand-filled PDF work order. Once a quote request
comes in, Matt sets a price and the customer gets a link to review
everything they submitted plus the price, and accept (with an
e-signature) or decline — no retyping anything.

**The flow:**

1. Customer submits a quote request (as above) — logged to the Sheet
   with a unique `Quote ID`.
2. Matt signs in at `/admin`, sees open requests, types a price, and
   clicks "Send work order." This updates the Sheet and emails the
   customer a secure link.
3. The customer opens `/work-order/[token]`, reviews the details and
   price, and clicks **Accept** (types their name, checks an
   agreement box) or **Decline**.
4. On accept: their name, a timestamp, and their IP address are
   recorded (the e-signature audit trail), a PDF of the whole
   agreement is generated and emailed to both Matt and the customer,
   and the Sheet is updated. On decline: Matt just gets notified.

**Legal basis:** North Carolina's Uniform Electronic Transactions Act
(UETA, N.C.G.S. Chapter 66, Article 40) and the federal ESIGN Act make
this kind of electronic signature just as enforceable as a wet
signature on an ordinary service contract, as long as there's clear
intent to sign (typed name + checkbox + explicit Accept button),
the signature is attributable to the signer (name, timestamp, IP on
record), and both parties can get an accessible, reproducible copy
(the emailed PDF covers this). None of UETA/ESIGN's excluded document
categories (wills, family law filings, eviction/foreclosure/utility
shutoff notices, etc.) apply to a survey work order. This is general
information, not legal advice — if Matt wants a final sanity check on
the exact wording, his insurance agent or a local attorney can take a
quick look.

**Required env vars** (beyond the ones above):

```bash
# .env.local
ADMIN_PASSWORD=choose-a-password
ADMIN_SESSION_SECRET=generate-with-openssl-rand--hex-32
WORK_ORDER_TOKEN_SECRET=generate-with-openssl-rand--hex-32
```

`ADMIN_PASSWORD` is the shared password for `/admin` (there's one
user, so a single password rather than real accounts is the right
amount of complexity here). `ADMIN_SESSION_SECRET` and
`WORK_ORDER_TOKEN_SECRET` are each any long random string — generate
one with `openssl rand -hex 32` — used to sign the admin session
cookie and the customer-facing work order links respectively so
neither can be forged. Work order links expire 30 days after being
sent.

Without these set, `/admin` isn't reachable and the whole Phase 3 flow
is simply unavailable — email and the quote form itself still work
exactly as before.

## Job schedule

A shared calendar at `/admin/schedule`, behind the same staff login as the
quote requests page. Jobs are entered by hand (the crew decides when to do
what based on where they already are that day, not something that can be
automated from a quote), so this is just a calendar view over its own
"Schedule" tab in the same Google Sheet: date, time, job/customer, assigned
worker (Matt/Jon/Jerrett/Unassigned), location, notes. Click a day to see or
add jobs; click a job to edit or delete it. Everyone who signs in at `/admin`
sees and can edit the same calendar, since there's one shared staff password
rather than individual logins.

No new env vars needed, it reuses `GOOGLE_SHEET_ID` /
`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_KEY` and the same
admin auth as the quote requests page.

## Known placeholders / TODOs before launch

A few things are intentionally stubbed because the real material wasn't
available yet, grep for `TODO` to find them in code, but the main ones:

- **Example survey image** (`src/app/examples/page.tsx`): still a
  placeholder schematic graphic. Needs a real example survey photo
  from Matt, swap in once we have one.
- **Logo**: real logo (`logo-mark.jpg`) is in place in the header and
  homepage hero. The wordmark variant (`logo-wordmark.jpg`, the bright
  green "4PTSS.com" graphic) is saved in `/public/brand/` but not used
  anywhere — it doesn't match the header's "Four Points Surveyors,
  PLLC" text wordmark, so left as-is for now. Worth a deliberate call
  on whether it replaces anything, not a drop-in swap.

## Work order form

The old site had a "Forms" page where customers could download a
blank `work_order_sheet_2024.pdf` and fill it out by hand. That page
has been removed: the real form (saved in `docs/reference/` for
reference, not published) turned out to be an internal office
document — price, job type, buyer names, deed/plat references — that
Matt fills in himself once a job is booked, not something a customer
fills out. The quote request form on `/contact` already does the
customer-facing version of this job better (structured fields,
emailed straight to him, no printing/scanning).

The Phase 3 plan is to use this PDF's fields as the template for an
auto-generated work order: once Matt accepts a quote, the system
generates a filled-in work order (from the same field set as the real
PDF) and emails it, instead of him re-typing everything by hand.

## Project structure

```
src/
  app/            Pages (one folder per route)
  app/api/quote/  Quote request form handler
  components/     Shared UI (Header, Footer, Accordion, QuoteForm, ...)
  lib/content.ts  All business content (services, prices, FAQ, counties, ...)
                  Edit this file to change site copy without touching layout code.
  lib/quoteSchema.ts  Validation schema shared by the form and the API route
```
