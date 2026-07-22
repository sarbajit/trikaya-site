import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { searchProperties, groupByDestination } from "@/lib/property-search";
import { getSiteSettings } from "@/models/SiteSettings";
import { PropertyPhoto } from "../PropertyPhoto";
import { HERO_TEXT_STYLE } from "../hero-text-style";
import { PropertyCard } from "../PropertyCard";
import { SectionDivider } from "../SectionDivider";
import { Button } from "@/components/ui/button";

export async function PortfolioHome() {
  const [{ results }, settings] = await Promise.all([
    searchProperties({ pageSize: 100 }),
    getSiteSettings(),
  ]);
  const groups = groupByDestination(results);
  const destinations = Array.from(groups.keys());

  return (
    <div>
      <section className="relative overflow-hidden">
        <PropertyPhoto
          image={settings.heroImageUrl ? { url: settings.heroImageUrl, alt: "" } : null}
          seedKey={`${settings.companyName}-portfolio-hero`}
          alt=""
          className="h-[52vh] min-h-[340px] w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div
            className="animate-fade-up mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6"
            style={HERO_TEXT_STYLE}
          >
            <span className="rounded-sm bg-white/90 px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {destinations.length} destinations
            </span>
            <h1 className="mt-2 max-w-2xl font-display text-4xl text-foreground sm:text-5xl">
              Boutique stays across the Eastern Himalaya
            </h1>
            <p className="mt-4 max-w-xl text-foreground/80">
              Heritage hotels, valley resorts, and family-run homestays — hand-picked across Sikkim, Darjeeling,
              Kalimpong, Meghalaya, and Arunachal Pradesh.
            </p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/properties">
                Browse all properties <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <SectionDivider seed={0} />
      </div>

      {destinations.map((destination) => {
        const properties = groups.get(destination)!;
        return (
          <section key={destination} className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {properties.length} {properties.length === 1 ? "property" : "properties"}
                </span>
                <h2 className="mt-1 font-display text-2xl text-foreground">{destination}</h2>
              </div>
              {properties.length > 4 && (
                <Link
                  href={`/properties?destination=${encodeURIComponent(destination)}`}
                  className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  See all <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {properties.slice(0, 4).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
