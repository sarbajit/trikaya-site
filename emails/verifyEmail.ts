import { renderEmailLayout } from "./layout";

export function verifyEmailTemplate(params: { name: string; url: string }): { subject: string; html: string } {
  const { name, url } = params;

  return {
    subject: "Verify your email address",
    html: renderEmailLayout({
      title: "Verify your email address",
      bodyHtml: `<p>Hi ${name},</p><p>Thanks for registering. Please confirm your email address to activate your account. This link expires in 24 hours.</p>`,
      ctaLabel: "Verify email",
      ctaUrl: url,
    }),
  };
}
