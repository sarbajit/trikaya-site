// Email HTML has no access to app/theme.css CSS variables at render time, so a
// fixed inline hex (matching the default --color-primary) is used here as an
// explicit, deliberate exception to the "theme tokens only" rule.
const BRAND_COLOR = "#1e3a8a";

export function renderEmailLayout(params: { title: string; bodyHtml: string; ctaLabel: string; ctaUrl: string }): string {
  const { title, bodyHtml, ctaLabel, ctaUrl } = params;

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="font-size: 20px; color: #111827;">${title}</h1>
      <div style="font-size: 14px; color: #374151; line-height: 1.6;">${bodyHtml}</div>
      <div style="margin: 24px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;">${ctaLabel}</a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:<br />${ctaUrl}</p>
    </div>
  `;
}
