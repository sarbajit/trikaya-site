import Link from "next/link";
import { Instagram, Facebook, Twitter, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteFooterProps {
  companyName: string;
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

export function SiteFooter({ companyName, addresses, phones, emails, socialLinks }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg text-foreground">{companyName}</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
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
                      className="text-muted-foreground transition-colors hover:text-primary"
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
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Explore</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/" className="text-foreground/80 hover:text-primary">
                Home
              </Link>
              <Link href="/properties" className="text-foreground/80 hover:text-primary">
                Properties
              </Link>
              <Link href="/about" className="text-foreground/80 hover:text-primary">
                About Us
              </Link>
              <Link href="/contact" className="text-foreground/80 hover:text-primary">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Legal</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/terms" className="text-foreground/80 hover:text-primary">
                Terms & Conditions
              </Link>
              <Link href="/privacy-policy" className="text-foreground/80 hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/refund-cancellation-policy" className="text-foreground/80 hover:text-primary">
                Refund & Cancellation Policy
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Reach us</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-foreground/80">
              {addresses.map((address) => (
                <span key={address} className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> {address}
                </span>
              ))}
              {phones.map((phone) => (
                <a key={phone} href={`tel:${phone}`} className="flex items-center gap-2 hover:text-primary">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" /> {phone}
                </a>
              ))}
              {emails.map((email) => (
                <a key={email} href={`mailto:${email}`} className="flex items-center gap-2 hover:text-primary">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" /> {email}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
