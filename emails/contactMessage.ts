import { renderEmailLayout } from "./layout";

// name/email/message come from an unauthenticated public form — escape before
// interpolating into the email HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function contactMessageTemplate(params: {
  name: string;
  email: string;
  message: string;
  adminUrl: string;
}): { subject: string; html: string } {
  const { name, email, message, adminUrl } = params;

  return {
    subject: `New contact form message from ${name}`,
    html: renderEmailLayout({
      title: "New contact message",
      bodyHtml: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
      ctaLabel: "View in admin",
      ctaUrl: adminUrl,
    }),
  };
}
