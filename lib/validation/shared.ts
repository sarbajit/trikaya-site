import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid id");

export const imageSchema = z.object({
  url: z.string().trim().url("Must be a valid URL"),
  alt: z.string().trim().min(1, "Alt text is required"),
});

export type ImageInput = z.infer<typeof imageSchema>;
