import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { searchProperties, getFilterOptions } from "@/lib/property-search";
import { getSiteSettings } from "@/models/SiteSettings";
import { PropertyPhoto } from "../PropertyPhoto";
import { HERO_TEXT_STYLE } from "../hero-text-style";
import { PropertyCard } from "../PropertyCard";
import { SearchFilterBar } from "../SearchFilterBar";
import { EmptyState } from "../EmptyState";
import { SectionDivider } from "../SectionDivider";
import { Badge } from "@/components/ui/badge";

export async function PortalHome() {
  const [{ results }, filterOptions, settings] = await Promise.all([
    searchProperties({ pageSize: 8 }),
    getFilterOptions(),
    getSiteSettings(),
  ]);

  const destinationCounts = new Map<string, number>();
  for (const property of results) {
    destinationCounts.set(property.destination, (destinationCounts.get(property.destination) ?? 0) + 1);
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <PropertyPhoto
          image={settings.heroImageUrl ? { url: settings.heroImageUrl, alt: "" } : null}
          seedKey={`${settings.companyName}-portal-hero`}
          alt=""
          className="h-[46vh] min-h-[300px] w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div
            className="animate-fade-up mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6"
            style={HERO_TEXT_STYLE}
          >
            <span className="rounded-sm bg-white/90 px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {settings.companyName}
            </span>
            <h1 className="mt-2 max-w-2xl font-display text-4xl text-foreground sm:text-5xl">
              Find your next stay in the Northeast
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6">
        <SearchFilterBar
          destinations={filterOptions.destinations}
          amenities={filterOptions.amenities}
          priceBounds={filterOptions.priceBounds}
          initial={{ amenities: [] }}
        />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Popular destinations</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from(destinationCounts.entries()).map(([destination, count]) => (
            <Link key={destination} href={`/properties?destination=${encodeURIComponent(destination)}`}>
              <Badge variant="outline" className="px-3 py-1.5 text-sm">
                {destination} <span className="text-muted-foreground">({count})</span>
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionDivider seed={0} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Featured properties</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Guest stories</h2>
        <div className="mt-5">
          <EmptyState
            icon={MessageSquareHeart}
            title="Guest stories, coming soon"
            description="As bookings complete, verified guest reviews from across our properties will appear here."
          />
        </div>
      </section>
    </div>
  );
}
