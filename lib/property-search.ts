import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";

export interface PropertyListItem {
  id: string;
  slug: string;
  name: string;
  destination: string;
  address: string;
  description: string;
  propertyType: string;
  amenities: string[];
  starRating?: number;
  googleRating?: number;
  googleRatingCount?: number;
  minPriceB2C: number | null;
  maxOccupancy: number;
  heroImage: { url: string; alt: string } | null;
}

export interface PropertySearchFilters {
  destination?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  page?: number;
  pageSize?: number;
}

export interface PropertySearchResult {
  results: PropertyListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 9;

/**
 * Filters properties by destination/amenities (Mongo query) then by
 * guests/price (in-memory against room-type stats, since real availability
 * requires the pricing engine + Availability collection built in Phase 6/7).
 * checkIn/checkOut are intentionally not applied here yet — see Phase 4 plan.
 */
export async function searchProperties(filters: PropertySearchFilters = {}): Promise<PropertySearchResult> {
  await connectDB();

  const query: Record<string, unknown> = { isActive: true };
  if (filters.destination) query.destination = filters.destination;
  if (filters.amenities?.length) query.amenities = { $all: filters.amenities };

  const properties = await Property.find(query).sort({ starRating: -1, name: 1 }).lean();
  const propertyIds = properties.map((p) => p._id);
  const roomTypes = await RoomType.find({ propertyId: { $in: propertyIds } })
    .select("propertyId basePriceB2C maxOccupancy")
    .lean();

  const statsByProperty = new Map<string, { minPrice: number; maxOccupancy: number }>();
  for (const rt of roomTypes) {
    const key = rt.propertyId.toString();
    const existing = statsByProperty.get(key);
    statsByProperty.set(key, {
      minPrice: existing ? Math.min(existing.minPrice, rt.basePriceB2C) : rt.basePriceB2C,
      maxOccupancy: existing ? Math.max(existing.maxOccupancy, rt.maxOccupancy) : rt.maxOccupancy,
    });
  }

  let combined: PropertyListItem[] = properties.map((property) => {
    const stats = statsByProperty.get(property._id.toString());
    return {
      id: property._id.toString(),
      slug: property.slug,
      name: property.name,
      destination: property.destination,
      address: property.address,
      description: property.description,
      propertyType: property.propertyType,
      amenities: property.amenities,
      starRating: property.starRating,
      googleRating: property.googleRating,
      googleRatingCount: property.googleRatingCount,
      minPriceB2C: stats?.minPrice ?? null,
      maxOccupancy: stats?.maxOccupancy ?? 0,
      heroImage: property.images?.[0] ? { url: property.images[0].url, alt: property.images[0].alt } : null,
    };
  });

  if (filters.guests) {
    combined = combined.filter((p) => p.maxOccupancy >= filters.guests!);
  }
  if (filters.minPrice != null) {
    combined = combined.filter((p) => p.minPriceB2C != null && p.minPriceB2C >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    combined = combined.filter((p) => p.minPriceB2C != null && p.minPriceB2C <= filters.maxPrice!);
  }

  const total = combined.length;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const start = (page - 1) * pageSize;
  const results = combined.slice(start, start + pageSize);

  return { results, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface FilterOptions {
  destinations: string[];
  amenities: string[];
  priceBounds: { min: number; max: number };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  await connectDB();
  const [destinations, amenities, roomTypes] = await Promise.all([
    Property.distinct("destination", { isActive: true }),
    Property.distinct("amenities", { isActive: true }),
    RoomType.find({}).select("basePriceB2C").lean(),
  ]);
  const prices = roomTypes.map((r) => r.basePriceB2C);
  return {
    destinations: (destinations as string[]).sort(),
    amenities: (amenities as string[]).sort(),
    priceBounds: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 20000,
    },
  };
}

/** Groups an already-fetched property list by destination, preserving sort order. */
export function groupByDestination<T extends { destination: string }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.destination);
    if (list) list.push(item);
    else groups.set(item.destination, [item]);
  }
  return groups;
}
