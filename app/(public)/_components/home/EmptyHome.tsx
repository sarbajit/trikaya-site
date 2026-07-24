import Link from "next/link";
import { Compass } from "lucide-react";
import { getSiteSettings } from "@/models/SiteSettings";
import { HeroSlider } from "../HeroSlider";
import { HERO_TEXT_STYLE } from "../hero-text-style";
import { Button } from "@/components/ui/button";

export async function EmptyHome() {
  const settings = await getSiteSettings();
  const heroImages =
    settings.heroImageUrls.length > 0
      ? settings.heroImageUrls.map((image) => ({ url: image.url, alt: image.alt }))
      : settings.heroImageUrl
        ? [{ url: settings.heroImageUrl, alt: "" }]
        : [null];

  return (
    <HeroSlider
      images={heroImages}
      seedKey={`${settings.companyName}-empty-hero`}
      className="h-[calc(100vh-4rem)] min-h-[560px] w-full"
    >
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
    </HeroSlider>
  );
}
