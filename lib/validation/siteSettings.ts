import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex color like #1e3a8a");

const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, "Platform is required"),
  url: z.string().trim().url("Must be a valid URL"),
});

const taxSettingsSchema = z.object({
  gstin: z.string().trim().optional(),
});

export const siteSettingsUpdateSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  showCompanyName: z.boolean(),
  logoUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  heroImageUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  heroImageUrls: z
    .array(z.object({ url: z.string().trim().url("Must be a valid URL"), alt: z.string().trim().min(1, "Alt text is required") }))
    .default([]),
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  addresses: z.array(z.string().trim().min(1)).default([]),
  phones: z.array(z.string().trim().min(1)).default([]),
  emails: z.array(z.string().trim().email("Must be a valid email")).default([]),
  socialLinks: z.array(socialLinkSchema).default([]),
  contactRecipientEmail: z.string().trim().email("Must be a valid email"),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^[1-9]\d{6,14}$/, "Digits only, with country code, no + or leading zero")
    .optional()
    .or(z.literal("")),
  b2bEnabled: z.boolean(),
  bookingEnabled: z.boolean(),
  invoicePrefix: z.string().trim().min(1, "Invoice prefix is required"),
  taxSettings: taxSettingsSchema.optional(),
  childMaxAge: z.number().int().min(0, "Must be 0 or greater"),
});

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;
