import { renderEmailLayout } from "./layout";

export function dataDeletionRequestedTemplate(params: { name: string; email: string; adminUrl: string }): {
  subject: string;
  html: string;
} {
  const { name, email, adminUrl } = params;

  return {
    subject: `Account deletion request from ${name}`,
    html: renderEmailLayout({
      title: "Account deletion request",
      bodyHtml: `<p>${name} (${email}) has requested their account be deleted.</p><p>Per our GDPR/DPDP policy, anonymize their profile in the GDPR admin page — their booking and invoice records must be retained (anonymized) for tax/legal purposes rather than hard-deleted.</p>`,
      ctaLabel: "Review in admin",
      ctaUrl: adminUrl,
    }),
  };
}
