import { z } from "zod";
import { isValidISODateString } from "@/lib/date-helpers";
import { objectIdSchema } from "@/lib/validation/shared";

const isoDateSchema = z.string().refine(isValidISODateString, "Must be a valid date (yyyy-MM-dd)");

const roomSelectionSchema = z.object({
  roomTypeId: objectIdSchema,
  adults: z.number().int().min(1),
  childAges: z.array(z.number().int().min(0).max(17)).max(10).default([]),
});

export const bookingQuoteRequestSchema = z.object({
  checkIn: isoDateSchema,
  checkOut: isoDateSchema,
  rooms: z.array(roomSelectionSchema).min(1, "At least one room is required"),
});

export type BookingQuoteRequestInput = z.infer<typeof bookingQuoteRequestSchema>;

export const createBookingSchema = bookingQuoteRequestSchema;

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const createPaymentOrderSchema = z.object({
  bookingId: objectIdSchema,
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
