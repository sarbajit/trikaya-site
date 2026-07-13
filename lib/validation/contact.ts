import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Must be a valid email"),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
});

export type ContactInput = z.infer<typeof contactSchema>;
