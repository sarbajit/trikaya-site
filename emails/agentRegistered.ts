import { renderEmailLayout } from "./layout";

export function agentRegisteredTemplate(params: {
  businessName: string;
  contactPerson: string;
  email: string;
  reviewUrl: string;
}): { subject: string; html: string } {
  const { businessName, contactPerson, email, reviewUrl } = params;

  return {
    subject: `New B2B agent registration: ${businessName}`,
    html: renderEmailLayout({
      title: "New agent registration",
      bodyHtml: `<p>A new B2B agent has registered and is awaiting approval.</p><p><strong>Business:</strong> ${businessName}<br /><strong>Contact:</strong> ${contactPerson}<br /><strong>Email:</strong> ${email}</p>`,
      ctaLabel: "Review in admin",
      ctaUrl: reviewUrl,
    }),
  };
}
