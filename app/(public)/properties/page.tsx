import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { searchProperties, getFilterOptions } from "@/lib/property-search";
import { SearchFilterBar } from "../_components/SearchFilterBar";
import { PropertyCard } from "../_components/PropertyCard";
import { EmptyState } from "../_components/EmptyState";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Properties | Trikaya",
  description: "Browse boutique hotels, resorts, and homestays across Sikkim, Darjeeling, Kalimpong, Meghalaya, and Arunachal Pradesh.",
};

export const revalidate = 60;

interface PropertiesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const sp = await searchParams;

  const destination = first(sp.destination);
  const checkIn = first(sp.checkIn);
  const checkOut = first(sp.checkOut);
  const guests = first(sp.guests) ? Number(first(sp.guests)) : undefined;
  const minPrice = first(sp.minPrice) ? Number(first(sp.minPrice)) : undefined;
  const maxPrice = first(sp.maxPrice) ? Number(first(sp.maxPrice)) : undefined;
  const amenities = first(sp.amenities)?.split(",").filter(Boolean) ?? [];
  const page = first(sp.page) ? Number(first(sp.page)) : 1;

  const [{ results, total, totalPages }, filterOptions] = await Promise.all([
    searchProperties({ destination, guests, minPrice, maxPrice, amenities, page }),
    getFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Properties</span>
        <h1 className="mt-1 font-display text-3xl text-foreground sm:text-4xl">
          {total} {total === 1 ? "stay" : "stays"} across the Eastern Himalaya
        </h1>
      </div>

      <div className="mt-6">
        <SearchFilterBar
          destinations={filterOptions.destinations}
          amenities={filterOptions.amenities}
          priceBounds={filterOptions.priceBounds}
          initial={{ destination, checkIn, checkOut, guests, minPrice, maxPrice, amenities }}
        />
      </div>

      <div className="mt-8">
        {results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No properties match your search"
            description="Try widening your price range, removing an amenity, or choosing a different destination."
            action={
              <Button asChild variant="outline">
                <Link href="/properties">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (destination) params.set("destination", destination);
            if (guests) params.set("guests", String(guests));
            if (minPrice) params.set("minPrice", String(minPrice));
            if (maxPrice) params.set("maxPrice", String(maxPrice));
            if (amenities.length) params.set("amenities", amenities.join(","));
            params.set("page", String(p));
            return (
              <Button key={p} asChild variant={p === page ? "default" : "outline"} size="sm">
                <Link href={`/properties?${params.toString()}`}>{p}</Link>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
