# Project plan

Rebuilding the Four Points Surveyors website and adding real
automation to a few manual parts of the business, in phases.

## Phase 1: public site rebuild (in progress)

- Modern, mobile-friendly design, keeping the existing green brand
- Pages: Home, Services & Prices, FAQ (expandable), Property Records
  (links to each county's own GIS site), Examples, Payments, Forms,
  Contact
- Quote request form that emails the team instead of "call us"
- Built and reviewed as its own project first. Nothing touches the
  live `4ptss.com` site until it's ready to show and the domain
  question gets a real answer.

## Phase 2: show it, get the domain conversation going

- Share the working preview with Matt
- Get the blank survey work order PDF from him so Phase 3 can match
  its fields exactly
- Decide whether/when to point `4ptss.com` at this instead of Weebly

## Phase 3: quote to work order automation

- A place to track quote requests and their status (new, quoted,
  accepted), not just fire-and-forget emails
- A simple internal page for Matt to review requests and set a price
- Automated "quote sent" email to the customer with an accept link
- On accept, auto-create a work order pre-filled from the original
  request, instead of retyping everything into a PDF by hand
- Work order generates as a document, not a hand-filled PDF, and
  emails the team

## Phase 4 (later, separate project): internal records lookup tool

- Address in, county auto-detected, parcel info and (where feasible)
  deed book/page and plat book/page pulled automatically
- Starts with 1 to 3 counties, not all 8, since each county runs its
  own systems for this
- An internal tool for the team, not a public-facing feature,
  distinct from the Property Records page in Phase 1 (which just
  links out to each county's own site for anyone to self-serve)

## Explicitly not doing

- No public self-service GIS acreage calculator. Accuracy depends on
  deed conditions, not just parcel size, so this is better handled by
  linking to the counties' own records instead.
- No fully automated pricing shown to customers. Pricing stays
  human-reviewed; the form speeds up getting the right information to
  whoever is quoting, not the quote decision itself.
