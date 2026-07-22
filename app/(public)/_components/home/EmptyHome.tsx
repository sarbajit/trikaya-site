import Link from "next/link";
import { Compass } from "lucide-react";
import { getSiteSettings } from "@/models/SiteSettings";
import { PropertyPhoto } from "../PropertyPhoto";
import { HERO_TEXT_STYLE } from "../hero-text-style";
import { Button } from "@/components/ui/button";

export async function EmptyHome() {
  const settings = await getSiteSettings();

  return (
    <section className="relative overflow-hidden">
      <PropertyPhoto
        image={settings.heroImageUrl ? { url: settings.heroImageUrl, alt: "" } : null}
        seedKey={`${settings.companyName}-empty-hero`}
        alt=""
        className="h-[70vh] min-h-[420px] w-full"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="animate-fade-up flex max-w-md flex-col items-center gap-3 px-6 text-center"
          style={HERO_TEXT_STYLE}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-white/90">
            <Compass className="size-6 text-primary" aria-hidden />
          </span>
          <h1 className="font-display text-3xl text-foreground">{settings.companyName}</h1>
          <p className="text-foreground/80">
            We&apos;re preparing our first stays for the Eastern Himalaya and Northeast India. Check back soon.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/properties">Browse properties</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
