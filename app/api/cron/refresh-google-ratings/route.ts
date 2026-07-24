import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { isGooglePlacesConfigured } from "@/lib/google-places";
import { refreshGoogleRatingForProperty } from "@/lib/refresh-google-rating";
import { Property } from "@/models/Property";

const DELAY_BETWEEN_CALLS_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGooglePlacesConfigured()) {
    return NextResponse.json({ refreshed: 0, failed: 0, skipped: "manual mode" });
  }

  await connectDB();

  const properties = await Property.find({ googlePlaceId: { $exists: true, $ne: "" } }).select("_id slug");

  let refreshed = 0;
  let failed = 0;

  for (const property of properties) {
    const ok = await refreshGoogleRatingForProperty(property._id.toString());
    if (ok) {
      refreshed += 1;
      revalidatePath(`/properties/${property.slug}`);
    } else {
      failed += 1;
    }
    await sleep(DELAY_BETWEEN_CALLS_MS);
  }

  if (refreshed > 0) {
    revalidatePath("/");
    revalidatePath("/properties");
  }

  return NextResponse.json({ refreshed, failed });
}
