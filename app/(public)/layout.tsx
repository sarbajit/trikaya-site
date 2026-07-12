import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/models/SiteSettings";
import { auth } from "@/lib/auth";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  await connectDB();
  const [settings, session] = await Promise.all([getSiteSettings(), auth()]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        companyName={settings.companyName || "Trikaya"}
        showCompanyName={settings.showCompanyName}
        logoUrl={settings.logoUrl}
        isLoggedIn={Boolean(session?.user)}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        companyName={settings.companyName || "Trikaya"}
        addresses={settings.addresses}
        phones={settings.phones}
        emails={settings.emails}
        socialLinks={settings.socialLinks}
      />
    </div>
  );
}
