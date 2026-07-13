import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { connectDB } from "@/lib/db";
import { getSiteSettings } from "@/models/SiteSettings";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact Us | Trikaya" };

export default async function ContactPage() {
  await connectDB();
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl text-foreground sm:text-4xl">Get in touch</h1>
      <p className="mt-2 max-w-xl text-foreground/80">
        Questions about a stay, a booking, or a partnership? Send us a message and our team will get back to you.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <ContactForm />

        <aside className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Reach us</p>
          <div className="flex flex-col gap-3 text-sm text-foreground/80">
            {settings.addresses.map((address) => (
              <span key={address} className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> {address}
              </span>
            ))}
            {settings.phones.map((phone) => (
              <a key={phone} href={`tel:${phone}`} className="flex items-center gap-2 hover:text-primary">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" /> {phone}
              </a>
            ))}
            {settings.emails.map((email) => (
              <a key={email} href={`mailto:${email}`} className="flex items-center gap-2 hover:text-primary">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" /> {email}
              </a>
            ))}
            {settings.addresses.length === 0 && settings.phones.length === 0 && settings.emails.length === 0 && (
              <span className="text-muted-foreground">Contact details coming soon.</span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
