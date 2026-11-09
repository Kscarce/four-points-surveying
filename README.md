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
is where new quote requests land, if unset it falls back to the
placeholder email in `src/lib/content.ts`, which **should be replaced**
before this goes live.

## Known placeholders / TODOs before launch

A few things are intentionally stubbed because the real material wasn't
available yet, grep for `TODO` to find them in code, but the main ones:

- **Business email** (`src/lib/content.ts`): the live site obfuscates
  its email against scrapers, so the real address was never scraped.
  Needs the real inbox.
- **Example survey image** (`src/app/examples/page.tsx`): placeholder
  schematic graphic, swap in the real example survey photo.
- **Work order PDF** (`src/app/downloads/page.tsx`): the current site
  links to `work_order_sheet_2024.pdf`, which wasn't available to pull
  in automatically. Either drop the real file in
  `/public/forms/work-order.pdf` and link it, or skip straight to the
  online work order flow planned for Phase 3.
- **Property records county links** (`src/lib/content.ts`,
  `countyGisLinks`): 4 of 8 counties (Rockingham, Davidson, Stokes,
  Caswell) link to the county's homepage rather than a confirmed
  direct GIS page, flagged with `verified: false`. Worth a few
  minutes finding the exact page for each.
- **Logo**: real logo (`logo-mark.jpg`) is in place in the header and
  homepage hero. The wordmark variant (`logo-wordmark.jpg`) is saved
  in `/public/brand/` but not yet used anywhere — could replace the
  text wordmark in the header/footer if preferred.

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
