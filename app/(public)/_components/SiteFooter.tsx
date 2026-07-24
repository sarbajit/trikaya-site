
import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteFooterProps {
  companyName: string;
  logoUrl?: string;
  addresses: string[];
  phones: string[];
  emails: string[];
  socialLinks: SocialLink[];
}

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

export function SiteFooter({ companyName, logoUrl, addresses, phones, emails, socialLinks }: SiteFooterProps) {
  return (
    <footer className="border-t border-primary-foreground/10 bg-primary">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              {logoUrl && (
                <Image src={logoUrl} alt={companyName} width={36} height={36} className="rounded-sm" />
              )}
              <p className="font-display text-lg text-primary-foreground">{companyName}</p>
            </div>
            <p className="mt-2 max-w-xs text-sm text-primary-foreground/70">
              Boutique hotels, resorts, and homestays across the Eastern Himalaya and Northeast India.
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                {socialLinks.map((link) => {
                  const Icon = SOCIAL_ICONS[link.platform.toLowerCase()] ?? Mail;
                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                      aria-label={link.platform}
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">Explore</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/" className="text-primary-foreground/80 hover:text-primary-foreground">
                Home
              </Link>
              <Link href="/properties" className="text-primary-foreground/80 hover:text-primary-foreground">
                Properties
              </Link>
              <Link href="/about" className="text-primary-foreground/80 hover:text-primary-foreground">
                About Us
              </Link>
              <Link href="/contact" className="text-primary-foreground/80 hover:text-primary-foreground">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">Legal</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/terms" className="text-primary-foreground/80 hover:text-primary-foreground">
                Terms & Conditions
              </Link>
              <Link href="/privacy-policy" className="text-primary-foreground/80 hover:text-primary-foreground">
                Privacy Policy
              </Link>
              <Link href="/refund-cancellation-policy" className="text-primary-foreground/80 hover:text-primary-foreground">
                Refund & Cancellation Policy
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">Reach us</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-primary-foreground/80">
              {addresses.map((address) => (
                <span key={address} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary-foreground/70" /> {address}
                </span>
              ))}
              {phones.map((phone) => (
                <a key={phone} href={`tel:${phone}`} className="flex items-center gap-2 hover:text-primary-foreground">
                  <Phone className="size-3.5 shrink-0 text-primary-foreground/70" /> {phone}
                </a>
              ))}
              {emails.map((email) => (
                <a key={email} href={`mailto:${email}`} className="flex items-center gap-2 hover:text-primary-foreground">
                  <Mail className="size-3.5 shrink-0 text-primary-foreground/70" /> {email}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/70">
          &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
