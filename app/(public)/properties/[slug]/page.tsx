import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { connectDB } from "@/lib/db";
import { RICH_TEXT_CLASS } from "@/lib/rich-text-classes";
import { stripHtml } from "@/lib/strip-html";
import { cn } from "@/lib/utils";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { getSiteSettings } from "@/models/SiteSettings";
import { BookingCartProvider } from "../../_components/BookingCartContext";
import { PropertyGallery } from "../../_components/PropertyGallery";
import { StarRating } from "../../_components/StarRating";
import { AmenityIcon } from "../../_components/AmenityIcon";
import { RoomTypeCard } from "../../_components/RoomTypeCard";
import { PoliciesSection } from "../../_components/PoliciesSection";
import { MapPlaceholder } from "../../_components/MapPlaceholder";
import { ReviewsSection } from "../../_components/ReviewsSection";
import { SectionDivider } from "../../_components/SectionDivider";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { BookingWidget } from "@/components/BookingWidget";

export const revalidate = 3600;
export const dynamicParams = true;

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  hotel: "Hotel",
  resort: "Resort",
  homestay: "Homestay",
};

export async function generateStaticParams() {
  await connectDB();
  const properties = await Property.find({ isActive: true }).select("slug").lean();
  return properties.map((p) => ({ slug: p.slug }));
}

async function getProperty(slug: string) {
  await connectDB();
  const property = await Property.findOne({ slug, isActive: true }).lean();
  if (!property) return null;
  const rooms = await RoomType.find({ propertyId: property._id }).lean();
  return { property, rooms };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProperty(slug);
  if (!data) return { title: "Property not found | Trikaya" };
  return {
    title: `${data.property.name} — ${data.property.destination} | Trikaya`,
    description: stripHtml(data.property.description, 160),
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProperty(slug);
  if (!data) notFound();
  const { property, rooms } = data;
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {property.destination}
        </span>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">{property.name}</h1>
          <Badge variant="outline">{PROPERTY_TYPE_LABEL[property.propertyType] ?? property.propertyType}</Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <StarRating rating={property.googleRating} count={property.googleRatingCount} showValue />
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {property.address}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <PropertyGallery slug={property.slug} name={property.name} images={property.images} />
      </div>

      <BookingCartProvider>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="font-display text-2xl text-foreground">About this stay</h2>
            <div
              className={cn(RICH_TEXT_CLASS, "mt-3 max-w-2xl")}
              dangerouslySetInnerHTML={{ __html: property.description }}
            />
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              {property.amenities.map((amenity) => (
                <span key={amenity} className="flex items-center gap-2 text-sm text-foreground/80">
                  <AmenityIcon label={amenity} className="size-4 text-primary" /> {amenity}
                </span>
              ))}
            </div>
          </section>

          <SectionDivider seed={0} />

          <section>
            <h2 className="font-display text-2xl text-foreground">Rooms & rates</h2>
            <div className="mt-5 flex flex-col gap-4">
              {rooms.map((room) => (
                <RoomTypeCard
                  key={room._id.toString()}
                  propertySlug={property.slug}
                  layout="row"
                  room={{
                    id: room._id.toString(),
                    name: room.name,
                    maxOccupancy: room.maxOccupancy,
                    pricingModel: room.pricingModel,
                    basePriceB2C: room.basePriceB2C,
                    images: room.images,
                    amenities: room.amenities,
                  }}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground">Policies</h2>
            <div className="mt-5">
              <PoliciesSection policies={property.policies} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground">Location</h2>
            <div className="mt-5">
              <MapPlaceholder address={property.address} seedKey={property.slug} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-foreground">Guest reviews</h2>
            <div className="mt-5">
              <ReviewsSection propertyId={property._id.toString()} />
            </div>
          </section>
        </div>

        <Suspense
          fallback={
            <aside className="h-fit rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </aside>
          }
        >
          <BookingWidget
            rooms={rooms.map((room) => ({
              id: room._id.toString(),
              name: room.name,
              maxOccupancy: room.maxOccupancy,
              pricingModel: room.pricingModel,
              basePriceB2C: room.basePriceB2C,
            }))}
            bookingEnabled={settings.bookingEnabled}
          />
        </Suspense>
      </div>
      </BookingCartProvider>
    </div>
  );
}
