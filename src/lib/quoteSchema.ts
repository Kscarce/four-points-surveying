import { z } from "zod";

// Shared between the client form and the API route so validation can't
// drift between the two. Survey type values match `services` in
// content.ts plus a few options that don't have a fixed starting price.
export const surveyTypeOptions = [
  "Residential lot / loan survey",
  "House stakeout package",
  "Subdivision",
  "Topographic map",
  "Flood line determination",
  "Not sure / other",
] as const;

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(200),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z.string().trim().min(7, "Enter a phone number").max(40),
  propertyAddress: z.string().trim().min(5, "Enter the property address").max(400),
  county: z.string().trim().max(100).optional().or(z.literal("")),
  surveyType: z.enum(surveyTypeOptions),
  // Comes in from a checkbox (FormData gives "on" / undefined), so coerce
  // rather than require an actual boolean.
  wantsLineStakes: z.preprocess(
    (val) => val === "on" || val === true,
    z.boolean(),
  ),
  acreage: z.string().trim().max(100).optional().or(z.literal("")),
  timeline: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  // Honeypot field: real users never fill this in, bots usually do.
  company: z.string().max(0).optional().or(z.literal("")),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

// A logged quote request as stored in the Sheet: the submitted data
// plus the server-assigned id and whatever Matt/the customer have
// done with it since (price, signature, decision).
export type StoredQuoteRequest = QuoteRequest & {
  quoteId: string;
  timestamp: string;
  status: string;
  price: string;
  workOrderSent: string;
  signedByName: string;
  signedAt: string;
  signedIp: string;
  declineReason: string;
};
