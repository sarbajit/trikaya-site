import { z } from "zod";
import { isValidISODateString } from "@/lib/date-helpers";
import { objectIdSchema } from "@/lib/validation/shared";

const isoDateSchema = z.string().refine(isValidISODateString, "Must be a valid date (yyyy-MM-dd)");

export const quoteRequestSchema = z.object({
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  guests: z.number().int().min(1),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const createBookingSchema = quoteRequestSchema.extend({
  roomTypeId: objectIdSchema,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const createPaymentOrderSchema = z.object({
  bookingId: objectIdSchema,
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
