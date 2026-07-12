import { renderEmailLayout } from "./layout";

export function passwordResetTemplate(params: { name: string; url: string }): { subject: string; html: string } {
  const { name, url } = params;

  return {
    subject: "Reset your password",
    html: renderEmailLayout({
      title: "Reset your password",
      bodyHtml: `<p>Hi ${name},</p><p>We received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
      ctaLabel: "Reset password",
      ctaUrl: url,
    }),
  };
}
