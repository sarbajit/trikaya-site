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

export const requestToBookSchema = bookingQuoteRequestSchema.extend({
  guestNote: z.string().trim().max(1000, "Note must be 1000 characters or fewer").optional(),
});

export type RequestToBookInput = z.infer<typeof requestToBookSchema>;

export const adminBookingRequestActionSchema = z.object({
  action: z.enum(["confirm", "reject"]),
});

export type AdminBookingRequestActionInput = z.infer<typeof adminBookingRequestActionSchema>;

const newCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Must be a valid email"),
  phone: z.string().trim().optional(),
});

export const adminManualBookingSchema = z
  .object({
    propertyId: objectIdSchema,
    checkIn: isoDateSchema,
    checkOut: isoDateSchema,
    rooms: z.array(roomSelectionSchema).min(1, "At least one room is required"),
    customerMode: z.enum(["existing", "new"]),
    userId: objectIdSchema.optional(),
    newCustomer: newCustomerSchema.optional(),
  })
  .refine((data) => (data.customerMode === "existing" ? Boolean(data.userId) : Boolean(data.newCustomer)), {
    message: "Provide an existing customer or new customer details",
    path: ["customerMode"],
  });

export type AdminManualBookingInput = z.infer<typeof adminManualBookingSchema>;

export { roomSelectionSchema };

export const createPaymentOrderSchema = z.object({
  bookingId: objectIdSchema,
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
