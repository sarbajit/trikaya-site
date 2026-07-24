import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isGooglePlacesConfigured } from "@/lib/google-places";
import { refreshGoogleRatingForProperty } from "@/lib/refresh-google-rating";
import { Property } from "@/models/Property";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY isn't configured — enter the rating manually instead" },
      { status: 400 }
    );
  }

  await connectDB();

  const { id } = await params;
  const existing = await Property.findById(id).select("slug googlePlaceId");
  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  if (!existing.googlePlaceId) {
    return NextResponse.json({ error: "Set a Google Place ID before refreshing" }, { status: 400 });
  }

  const refreshed = await refreshGoogleRatingForProperty(id);
  if (!refreshed) {
    return NextResponse.json({ error: "Could not fetch a rating for this Place ID" }, { status: 502 });
  }

  const updated = await Property.findById(id).select("googleRating googleRatingCount googleRatingUpdatedAt");

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${existing.slug}`);

  return NextResponse.json({
    googleRating: updated?.googleRating,
    googleRatingCount: updated?.googleRatingCount,
    googleRatingUpdatedAt: updated?.googleRatingUpdatedAt,
  });
}
