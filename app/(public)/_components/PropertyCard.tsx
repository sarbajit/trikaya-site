import Link from "next/link";
import { Users } from "lucide-react";
import { PropertyPhoto } from "./PropertyPhoto";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import type { PropertyListItem } from "@/lib/property-search";

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  hotel: "Hotel",
  resort: "Resort",
  homestay: "Homestay",
};

export function PropertyCard({ property }: { property: PropertyListItem }) {
  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <PropertyPhoto
        image={property.heroImage}
        seedKey={property.slug}
        alt={property.name}
        className="aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {property.destination}
          </span>
          <Badge variant="outline">{PROPERTY_TYPE_LABEL[property.propertyType] ?? property.propertyType}</Badge>
        </div>
        <h3 className="font-display text-lg leading-tight text-foreground">{property.name}</h3>
        <StarRating rating={property.starRating} />
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="size-3.5" /> Up to {property.maxOccupancy || "—"}
          </span>
          {property.minPriceB2C != null ? (
            <span className="text-foreground">
              <span className="text-muted-foreground">from </span>
              <span className="font-semibold">₹{property.minPriceB2C.toLocaleString("en-IN")}</span>
              <span className="text-muted-foreground">/night</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Rates on request</span>
          )}
        </div>
      </div>
    </Link>
  );
}
