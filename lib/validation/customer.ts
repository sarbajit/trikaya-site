import { z } from "zod";

const baseCustomerFields = {
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Must be a valid email"),
  phone: z.string().trim().optional(),
  role: z.enum(["customer", "admin"]),
  loginEnabled: z.boolean(),
};

export const adminCreateCustomerSchema = z
  .object({
    ...baseCustomerFields,
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
  })
  .refine((data) => !data.loginEnabled || Boolean(data.password), {
    message: "Password is required when login is enabled",
    path: ["password"],
  });

export type AdminCreateCustomerInput = z.infer<typeof adminCreateCustomerSchema>;

export const adminUpdateCustomerSchema = z.object({
  ...baseCustomerFields,
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type AdminUpdateCustomerInput = z.infer<typeof adminUpdateCustomerSchema>;
