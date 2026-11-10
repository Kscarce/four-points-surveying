// Central source of truth for Four Points Surveyors site content.
// Keeping this separate from the page components means a non-developer
// can eventually update prices, counties, or FAQ copy here without
// touching any layout code.

export const business = {
  name: "Four Points Surveyors, PLLC",
  shortName: "Four Points Surveyors",
  tagline: "Accurate, dependable land surveying for the Piedmont Triad",
  foundedBlurb:
    "Four Points Surveyors, PLLC is a land surveying company with a primary goal of providing accurate, dependable, and quality surveying services. With over 30 years of combined experience, we're more than qualified to handle any of your land surveying needs.",
  basedIn: "Greensboro, NC",
  mailingAddress: "P.O. Box 986, Summerfield, NC 27358",
  hours: "Monday - Friday, 8:00am to 5:00pm",
  // Also used as the "reply to" / notification target for the quote
  // form until a QUOTE_NOTIFY_EMAIL env var is set.
  email: "matt@4ptss.com",
  team: [
    { name: "Matt", role: "Surveyor", phone: "336.669.0209", email: "matt@4ptss.com", preferred: true },
    { name: "Jon", role: "Surveyor", phone: "336.669.7741", email: "", preferred: false },
    { name: "Jerrett", role: "Surveyor", phone: "336.349.8840", email: "", preferred: false },
  ],
  licensedSurveyor: "Gregory Matthew Gorrell, PLS",
} as const;

export const counties = [
  "Alamance",
  "Caswell",
  "Davidson",
  "Forsyth",
  "Guilford",
  "Randolph",
  "Rockingham",
  "Stokes",
] as const;

// Each county's own GIS/parcel lookup site, for the "look it up yourself"
// links on the Property Records page. `verified: true` means I confirmed
// the link points at the actual GIS/parcel tool. `verified: false` means
// I could only confirm the county's official domain, not the exact GIS
// subpage, so it links to their homepage for now, flagged in the UI as
// needing a direct link. Counties also migrate GIS providers occasionally,
// so these are worth rechecking periodically either way.
export const countyGisLinks: {
  county: string;
  url: string;
  verified: boolean;
}[] = [
  { county: "Guilford", url: "https://www.guilfordcountync.gov/government/departments-and-agencies/information-technology/geographic-information-systems/gis-online-services", verified: true },
  { county: "Forsyth", url: "https://www.forsyth.cc/tax/mapping.aspx", verified: true },
  { county: "Alamance", url: "https://www.alamance-nc.com/gis/", verified: true },
  { county: "Randolph", url: "https://www.randolphcountync.gov/255/GIS", verified: true },
  { county: "Rockingham", url: "https://www.webgis.net/nc/rockingham/", verified: true },
  { county: "Davidson", url: "https://davidson-county-hub-for-gis-davidsonco.hub.arcgis.com/", verified: true },
  { county: "Stokes", url: "https://www.stokescountygis.com/", verified: true },
  { county: "Caswell", url: "https://www.webgis.net/nc/caswell/", verified: true },
];

export const services = [
  {
    id: "lot-loan",
    name: "Residential lot / loan survey",
    startingPrice: 500,
    description:
      "Our lot-loan surveys include six full-color photos with point-of-view references to help you locate your property corners, plus a digital map that's easy to read and understand. We offer fast turnaround for loan closings and can work with your closing attorney or real estate agent. Digital copies of the map and the report will be provided.",
    highlights: [
      "Six full-color corner photos included",
      "Easy-to-read digital map",
      "Fast turnaround for loan closings",
      "Digital copies of map and report provided",
    ],
  },
  {
    id: "stakeout",
    name: "House stakeout package",
    startingPrice: 1200,
    description:
      "Includes a plot plan for building permits, house stakeout for footings, a lot survey at the time of stakeout, brick point for masons, and a foundation survey for banks. Additional trips for rough stakeout, basement stakeout, or marking property lines are billed separately. Foundation surveys do not include photos and are mailed after full payment is received.",
    highlights: [
      "Plot plan for building permits",
      "House stakeout for footings",
      "Brick point for masons",
      "Foundation survey for banks",
    ],
    note: "Additional trips (rough stakeout, basement stakeout, marking property lines): $250 per trip. Foundation surveys do not include photos.",
  },
] as const;

export const callForQuoteServices = [
  "Subdivisions",
  "Topographic maps",
  "Flood line determinations",
  "Any other land surveying need",
] as const;

export const faqs = [
  {
    question: "Can you just come out and mark corners or lines only? I don't need a full survey.",
    answer:
      "By law, we have to produce a map or report for any survey work we perform, so we can't just mark corners without documenting the work.",
  },
  {
    question: "Why do I need a survey?",
    answer:
      "Getting a survey before you purchase a property shows whether there are encroachments, such as a fence, building, driveway, well, or a house sitting over an easement or property line. It's not uncommon to discover issues like a property line running through part of a house, usually when a neighboring lot finally gets surveyed. A survey can also verify your acreage. We've seen cases where county tax records overstate or understate acreage, sometimes by several acres on older tracts, and a survey can be used to help correct tax records. In the past several years, lot surveys haven't always been required for loan closings, so plenty of newer homes have never been surveyed, meaning driveways, decks, wells, or structures could be sitting over a property line without anyone knowing. It's almost always cheaper to get a survey done than to pay to relocate a fence, driveway, or outbuilding later.",
  },
  {
    question: "What's included in your surveys?",
    answer:
      "Our surveys show all existing structures with dimensions to each property line, all property line dimensions and bearings, road rights-of-way and easements, driveways, walkways, and fences. We also include six full-color photos of the property corners so you can relocate them later without paying for another survey visit. At the property itself, corners are marked with flags. We also keep your corner records on file long after the survey is done, so we can help you go back and find them again years later.",
  },
  {
    question: "Why does the county's GIS website show the property line running through my house, garage, driveway, or fence?",
    answer:
      "County GIS websites are not an accurate source for property lines. They're a great resource for ownership and land records, but the property lines overlaid on aerial photography aren't precise. The only way to know exactly where your corners and lines are is to hire a licensed land surveyor.",
  },
  {
    question: "Why is there a property corner marker in the middle of my yard?",
    answer:
      "Almost always, that's a traverse point, a reference point set by the surveyor to locate structures and property pins without cutting bushes or trees. These are usually nails set into the ground with pink flagging. They aren't property lines or corners, just reference points used during the survey.",
  },
  {
    question: "How do I find my property corners myself?",
    answer:
      "Property pins are generally 18-inch-or-so iron pipes or rods, anywhere from about an inch to two feet underground. You could try a metal detector, but be careful, it's easy to find a misplaced pin, a stray ground rod, or even a neighbor's corner. It's usually cheaper to hire a surveyor to properly locate and, if needed, reset your corners than to risk moving a building, fence, or driveway based on a wrong guess.",
  },
  {
    question: "How long will the survey take to complete?",
    answer:
      "We can usually have a map complete within a week or two for lots under 4 acres. Field work for an average subdivision lot typically takes an hour or two. You don't need to be home for the survey since all our work is done outside.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "Cash, check, or PayPal.",
  },
] as const;

export const paymentMethods = [
  {
    name: "Cash or check",
    description: `Mail to: ${business.name}, ${business.mailingAddress}`,
  },
  {
    name: "PayPal, card, or Venmo",
    description: "Enter your invoice number below to pay online by credit card, PayPal, or Venmo.",
  },
] as const;
