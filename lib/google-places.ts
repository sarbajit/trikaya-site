export interface PlaceRating {
  rating: number;
  userRatingCount: number;
}

/**
 * When GOOGLE_PLACES_API_KEY isn't set, the app falls back to "manual mode":
 * admins type in a static rating per property instead of it being fetched
 * and refreshed automatically.
 */
export function isGooglePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

function getApiKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set");
  }
  return key;
}

/**
 * Fetches the live rating for a Google Place via Places API (New) Place
 * Details. Returns null (rather than throwing) for a bad/deleted place ID or
 * any non-2xx response, so one broken property doesn't abort a batch refresh.
 */
export async function fetchPlaceRating(placeId: string): Promise<PlaceRating | null> {
  const apiKey = getApiKey();

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "rating,userRatingCount",
    },
  });

  if (!response.ok) {
    console.error(`Google Places lookup failed for placeId ${placeId}: ${response.status} ${response.statusText}`);
    return null;
  }

  const data = await response.json();
  if (typeof data.rating !== "number") return null;

  return { rating: data.rating, userRatingCount: data.userRatingCount ?? 0 };
}
