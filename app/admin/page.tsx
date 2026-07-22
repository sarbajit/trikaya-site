import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/models/SiteSettings";
import { SiteSettingsForm } from "./_components/SiteSettingsForm";
import { PageHeader } from "./_components/PageHeader";

export default async function AdminSettingsPage() {
  await connectDB();
  const settings = await getSiteSettings();

  const initialSettings = {
    companyName: settings.companyName,
    showCompanyName: settings.showCompanyName,
    logoUrl: settings.logoUrl ?? "",
    heroImageUrl: settings.heroImageUrl ?? "",
    primaryColor: settings.primaryColor ?? "",
    secondaryColor: settings.secondaryColor ?? "",
    accentColor: settings.accentColor ?? "",
    addresses: [...settings.addresses],
    phones: [...settings.phones],
    emails: [...settings.emails],
    socialLinks: settings.socialLinks.map((link) => ({ platform: link.platform, url: link.url })),
    contactRecipientEmail: settings.contactRecipientEmail,
    b2bEnabled: settings.b2bEnabled,
    bookingEnabled: settings.bookingEnabled,
    invoicePrefix: settings.invoicePrefix,
    taxSettings: settings.taxSettings ? { gstin: settings.taxSettings.gstin ?? "" } : undefined,
    childMaxAge: settings.childMaxAge,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Branding & Site Settings"
        description="These settings control the company branding and theme colors used across the site."
      />
      <SiteSettingsForm initialSettings={initialSettings} />
    </div>
  );
}
