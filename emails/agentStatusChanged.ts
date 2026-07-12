import { renderEmailLayout } from "./layout";
import type { AgentStatus } from "@/models/Agent";

const STATUS_COPY: Record<Exclude<AgentStatus, "pending">, { subject: string; body: string }> = {
  approved: {
    subject: "Your agent account has been approved",
    body: "Good news — your business account has been approved. You can now log in to access B2B rates.",
  },
  rejected: {
    subject: "Your agent application was not approved",
    body: "After review, we're unable to approve your business account at this time. Contact us if you have questions.",
  },
  suspended: {
    subject: "Your agent account has been suspended",
    body: "Your business account has been suspended and can no longer be used to log in. Contact us if you have questions.",
  },
};

export function agentStatusChangedTemplate(params: {
  contactPerson: string;
  status: Exclude<AgentStatus, "pending">;
  loginUrl: string;
}): { subject: string; html: string } {
  const { contactPerson, status, loginUrl } = params;
  const copy = STATUS_COPY[status];

  return {
    subject: copy.subject,
    html: renderEmailLayout({
      title: copy.subject,
      bodyHtml: `<p>Hi ${contactPerson},</p><p>${copy.body}</p>`,
      ctaLabel: "Go to login",
      ctaUrl: loginUrl,
    }),
  };
}
