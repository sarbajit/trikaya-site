import { z } from "zod";
import { isValidISODateString } from "@/lib/date-helpers";

const isoDateSchema = z.string().refine(isValidISODateString, "Must be a valid date (yyyy-MM-dd)");

export const availabilityBulkActionSchema = z.object({
  action: z.enum(["block", "unblock"]),
  dates: z.array(isoDateSchema).min(1, "Select at least one date").max(366),
});

export type AvailabilityBulkActionInput = z.infer<typeof availabilityBulkActionSchema>;
