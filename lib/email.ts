import { Resend } from "resend";
import { verifyEmailTemplate } from "@/emails/verifyEmail";
import { passwordResetTemplate } from "@/emails/passwordReset";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping email send (would have sent "${subject}" to ${to})`);
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (error) {
    console.error("Failed to send email", error);
    throw new Error("Failed to send email");
  }
}

export async function sendVerificationEmail(params: { to: string; name: string; url: string }): Promise<void> {
  const { subject, html } = verifyEmailTemplate({ name: params.name, url: params.url });
  await send(params.to, subject, html);
}

export async function sendPasswordResetEmail(params: { to: string; name: string; url: string }): Promise<void> {
  const { subject, html } = passwordResetTemplate({ name: params.name, url: params.url });
  await send(params.to, subject, html);
}
