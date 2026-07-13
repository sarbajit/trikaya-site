import { z } from "zod";

export const updateStaticPageSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string(),
});

export type UpdateStaticPageInput = z.infer<typeof updateStaticPageSchema>;
