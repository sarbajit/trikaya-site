import { z } from "zod";
import { imageSchema, objectIdSchema } from "./shared";

export const roomTypeSchema = z.object({
  propertyId: objectIdSchema,
  name: z.string().trim().min(1, "Name is required"),
  maxOccupancy: z.number().int().min(1, "Must allow at least 1 guest"),
  pricingModel: z.enum(["per_night", "per_person_per_night"]),
  basePriceB2C: z.number().min(0),
  basePriceB2B: z.number().min(0),
  images: z.array(imageSchema).default([]),
  totalInventory: z.number().int().min(0),
});

export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
