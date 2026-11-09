import { z } from "zod";

// Who a schedule entry can be assigned to. Kept here (not derived from
// content.ts) because the calendar is about field crew work, not the
// public-facing team bios, and "Unassigned" is a valid state too.
export const scheduleWorkerOptions = [
  "Matt",
  "Jon",
  "Jerrett",
  "Unassigned",
] as const;

export const scheduleEntrySchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  time: z.string().trim().max(40).optional().or(z.literal("")),
  job: z.string().trim().min(1, "Enter a job or customer name").max(200),
  worker: z.enum(scheduleWorkerOptions),
  location: z.string().trim().max(400).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ScheduleEntryInput = z.infer<typeof scheduleEntrySchema>;

export type ScheduleEntry = ScheduleEntryInput & {
  entryId: string;
};
