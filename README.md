# Four Points Surveyors

A rebuild of the website for Four Points Surveyors, PLLC, a land
surveying company serving the Piedmont Triad region of North
Carolina. Replaces the previous Weebly-based site with a modern,
mobile-friendly site and an automated quote request flow.

## Status

Phase 1 in progress: public site rebuild + quote request form.
See `PLAN.md` for the full phased plan (site, then quote-to-work-order
automation, then an internal records lookup tool).

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

## Known placeholders / TODOs before launch

A few things are intentionally stubbed because the real material wasn't
available yet, grep for `TODO` to find them in code, but the main ones:

- **Example survey image** (`src/app/examples/page.tsx`): placeholder
  schematic graphic, swap in the real example survey photo.
- **Property records county links** (`src/lib/content.ts`,
  `countyGisLinks`): 4 of 8 counties (Rockingham, Davidson, Stokes,
  Caswell) link to the county's homepage rather than a confirmed
  direct GIS page, flagged with `verified: false`. Worth a few
  minutes finding the exact page for each.
- **Logo**: real logo (`logo-mark.jpg`) is in place in the header and
  homepage hero. The wordmark variant (`logo-wordmark.jpg`) is saved
  in `/public/brand/` but not yet used anywhere — could replace the
  text wordmark in the header/footer if preferred.

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
