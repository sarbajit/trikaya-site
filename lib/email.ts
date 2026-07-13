import { Resend } from "resend";
import { verifyEmailTemplate } from "@/emails/verifyEmail";
import { passwordResetTemplate } from "@/emails/passwordReset";
import { agentRegisteredTemplate } from "@/emails/agentRegistered";
import { agentStatusChangedTemplate } from "@/emails/agentStatusChanged";
import { bookingConfirmedTemplate } from "@/emails/bookingConfirmed";
import { contactMessageTemplate } from "@/emails/contactMessage";
import { dataDeletionRequestedTemplate } from "@/emails/dataDeletionRequested";
import type { AgentStatus } from "@/models/Agent";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

async function send(to: string, subject: string, html: string, attachments?: EmailAttachment[]): Promise<void> {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping email send (would have sent "${subject}" to ${to})`);
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  try {
    await resend.emails.send({ from, to, subject, html, attachments });
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

export async function sendAgentRegisteredAdminEmail(params: {
  to: string;
  businessName: string;
  contactPerson: string;
  email: string;
  reviewUrl: string;
}): Promise<void> {
  const { subject, html } = agentRegisteredTemplate({
    businessName: params.businessName,
    contactPerson: params.contactPerson,
    email: params.email,
    reviewUrl: params.reviewUrl,
  });
  await send(params.to, subject, html);
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  guestName: string;
  propertyName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  accountUrl: string;
  invoicePdf?: Buffer;
  invoiceNumber?: string;
}): Promise<void> {
  const { subject, html } = bookingConfirmedTemplate({
    guestName: params.guestName,
    propertyName: params.propertyName,
    roomTypeName: params.roomTypeName,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    totalAmount: params.totalAmount,
    currency: params.currency,
    accountUrl: params.accountUrl,
  });
  const attachments =
    params.invoicePdf && params.invoiceNumber
      ? [{ filename: `${params.invoiceNumber}.pdf`, content: params.invoicePdf }]
      : undefined;
  await send(params.to, subject, html, attachments);
}

export async function sendContactMessageEmail(params: {
  to: string;
  name: string;
  email: string;
  message: string;
  adminUrl: string;
}): Promise<void> {
  const { subject, html } = contactMessageTemplate({
    name: params.name,
    email: params.email,
    message: params.message,
    adminUrl: params.adminUrl,
  });
  await send(params.to, subject, html);
}

export async function sendDataDeletionRequestedEmail(params: {
  to: string;
  name: string;
  email: string;
  adminUrl: string;
}): Promise<void> {
  const { subject, html } = dataDeletionRequestedTemplate({
    name: params.name,
    email: params.email,
    adminUrl: params.adminUrl,
  });
  await send(params.to, subject, html);
}

export async function sendAgentStatusChangedEmail(params: {
  to: string;
  contactPerson: string;
  status: Exclude<AgentStatus, "pending">;
  loginUrl: string;
}): Promise<void> {
  const { subject, html } = agentStatusChangedTemplate({
    contactPerson: params.contactPerson,
    status: params.status,
    loginUrl: params.loginUrl,
  });
  await send(params.to, subject, html);
}
