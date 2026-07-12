import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/models/SiteSettings";
import { SiteSettingsForm } from "./_components/SiteSettingsForm";

export default async function AdminSettingsPage() {
  await connectDB();
  const settings = await getSiteSettings();

  const initialSettings = {
    companyName: settings.companyName,
    showCompanyName: settings.showCompanyName,
    logoUrl: settings.logoUrl ?? "",
    primaryColor: settings.primaryColor ?? "",
    secondaryColor: settings.secondaryColor ?? "",
    accentColor: settings.accentColor ?? "",
    addresses: [...settings.addresses],
    phones: [...settings.phones],
    emails: [...settings.emails],
    socialLinks: settings.socialLinks.map((link) => ({ platform: link.platform, url: link.url })),
    contactRecipientEmail: settings.contactRecipientEmail,
    b2bEnabled: settings.b2bEnabled,
    invoicePrefix: settings.invoicePrefix,
    taxSettings: settings.taxSettings ? { gstin: settings.taxSettings.gstin ?? "" } : undefined,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Branding &amp; Site Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        These settings control the company branding and theme colors used across the site.
      </p>
      <SiteSettingsForm initialSettings={initialSettings} />
    </main>
  );
}
