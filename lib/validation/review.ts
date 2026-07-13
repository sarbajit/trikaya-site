import { z } from "zod";
import { objectIdSchema } from "@/lib/validation/shared";

export const createReviewSchema = z.object({
  bookingId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const adminUpdateReviewStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type AdminUpdateReviewStatusInput = z.infer<typeof adminUpdateReviewStatusSchema>;
