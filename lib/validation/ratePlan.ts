import { z } from "zod";
import { isValidISODateString, parseISODate } from "@/lib/date-helpers";
import { objectIdSchema } from "./shared";

const isoDateSchema = z.string().refine(isValidISODateString, "Must be a valid date (yyyy-MM-dd)");

export const ratePlanSchema = z
  .object({
    roomTypeId: objectIdSchema,
    label: z.string().trim().optional(),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    b2cRate: z.number().min(0),
    b2bRate: z.number().min(0),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  })
  .refine((data) => parseISODate(data.endDate)!.getTime() > parseISODate(data.startDate)!.getTime(), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type RatePlanInput = z.infer<typeof ratePlanSchema>;
