import { z } from "zod";
import { passwordSchema } from "./auth";

export const registerAgentSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  gstin: z.string().trim().optional().or(z.literal("")),
  contactPerson: z.string().trim().min(1, "Contact person is required"),
  email: z.string().trim().email("Must be a valid email"),
  phone: z.string().trim().min(1, "Phone is required"),
  password: passwordSchema,
  proofDocUrls: z.array(z.string().url()).min(1, "Upload at least one business-proof document"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy to register" }),
  }),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;

export const adminUpdateAgentStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended"]),
});

export type AdminUpdateAgentStatusInput = z.infer<typeof adminUpdateAgentStatusSchema>;
