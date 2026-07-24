import { connectDB } from "@/lib/db";
import { fetchPlaceRating } from "@/lib/google-places";
import { Property } from "@/models/Property";

/**
 * Refreshes a single property's googleRating/googleRatingCount from its
 * googlePlaceId. Shared by the admin "Refresh now" route and the daily cron.
 * Returns false if there's no place ID to look up or the lookup failed.
 */
export async function refreshGoogleRatingForProperty(propertyId: string): Promise<boolean> {
  await connectDB();

  const property = await Property.findById(propertyId).select("googlePlaceId");
  if (!property?.googlePlaceId) return false;

  const result = await fetchPlaceRating(property.googlePlaceId);
  if (!result) return false;

  await Property.findByIdAndUpdate(propertyId, {
    googleRating: result.rating,
    googleRatingCount: result.userRatingCount,
    googleRatingUpdatedAt: new Date(),
  });

  return true;
}
