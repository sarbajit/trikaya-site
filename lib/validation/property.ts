import { z } from "zod";
import { slugify } from "@/lib/utils";
import { imageSchema } from "./shared";

const geoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const policiesSchema = z.object({
  checkIn: z.string().trim().optional(),
  checkOut: z.string().trim().optional(),
  houseRules: z.string().trim().optional(),
});

export const propertySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .transform((value) => slugify(value))
    .refine((value) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value), {
      message: "Slug must be lowercase letters, numbers, and hyphens",
    }),
  destination: z.string().trim().min(1, "Destination is required"),
  address: z.string().trim().min(1, "Address is required"),
  geo: geoSchema.optional(),
  description: z.string().trim().min(1, "Description is required"),
  propertyType: z.enum(["hotel", "resort", "homestay"]),
  amenities: z.array(z.string().trim().min(1)).default([]),
  images: z.array(imageSchema).default([]),
  starRating: z.number().int().min(1).max(5).optional(),
  googlePlaceId: z.string().trim().optional(),
  // Only used in "manual mode" (GOOGLE_PLACES_API_KEY unset) — admin types the
  // rating directly instead of it being fetched from Google Places.
  googleRating: z.number().min(0).max(5).optional(),
  policies: policiesSchema.optional(),
  isActive: z.boolean().default(true),
  homepageMode: z.enum(["auto", "single", "portfolio", "portal"]).default("auto"),
});

export type PropertyInput = z.infer<typeof propertySchema>;
