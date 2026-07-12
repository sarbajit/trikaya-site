import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Must be a valid email"),
  phone: z.string().trim().optional().or(z.literal("")),
  password: passwordSchema,
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy to register" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Must be a valid email"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Must be a valid email"),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const completeGoogleSignupSchema = z.object({
  token: z.string().min(1, "Token is required"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy to continue" }),
  }),
});

export type CompleteGoogleSignupInput = z.infer<typeof completeGoogleSignupSchema>;
