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
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  addresses: z.array(z.string().trim().min(1)).default([]),
  phones: z.array(z.string().trim().min(1)).default([]),
  emails: z.array(z.string().trim().email("Must be a valid email")).default([]),
  socialLinks: z.array(socialLinkSchema).default([]),
  contactRecipientEmail: z.string().trim().email("Must be a valid email"),
  b2bEnabled: z.boolean(),
  invoicePrefix: z.string().trim().min(1, "Invoice prefix is required"),
  taxSettings: taxSettingsSchema.optional(),
  childMaxAge: z.number().int().min(0, "Must be 0 or greater"),
});

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;
