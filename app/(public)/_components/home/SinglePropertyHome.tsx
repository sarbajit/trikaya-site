import { MapPin } from "lucide-react";
import { connectDB } from "@/lib/db";
import { RICH_TEXT_CLASS } from "@/lib/rich-text-classes";
import { cn } from "@/lib/utils";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { getSiteSettings } from "@/models/SiteSettings";
import { HERO_TEXT_STYLE } from "../hero-text-style";
import { HeroSlider } from "../HeroSlider";
import { PropertyGallery } from "../PropertyGallery";
import { StarRating } from "../StarRating";
import { AmenityIcon } from "../AmenityIcon";
import { RoomTypeCard } from "../RoomTypeCard";
import { PoliciesSection } from "../PoliciesSection";
import { MapPlaceholder } from "../MapPlaceholder";
import { ReviewsSection } from "../ReviewsSection";
import { SectionDivider } from "../SectionDivider";
import { Button } from "@/components/ui/button";

export async function SinglePropertyHome() {
  await connectDB();
  const property = await Property.findOne({ isActive: true }).lean();
  if (!property) return null;

  const [rooms, settings] = await Promise.all([
    RoomType.find({ propertyId: property._id }).lean(),
    getSiteSettings(),
  ]);
  const heroImages =
    settings.heroImageUrls.length > 0
      ? settings.heroImageUrls.map((image) => ({ url: image.url, alt: image.alt }))
      : settings.heroImageUrl
        ? [{ url: settings.heroImageUrl, alt: property.name }]
        : property.images.length > 0
          ? property.images
          : [null];

  return (
    <div>
      <HeroSlider images={heroImages} seedKey={property.slug} className="h-[calc(100vh-4rem)] min-h-[560px] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="animate-fade-up mx-auto w-full max-w-6xl px-4 sm:px-6" style={HERO_TEXT_STYLE}>
            <span className="rounded-sm bg-white/90 px-2 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {property.destination}
            </span>
            <h1 className="mt-2 font-display text-4xl text-foreground sm:text-5xl">{property.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating rating={property.starRating} />
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {property.address}
              </span>
            </div>
            <div
              className={cn(RICH_TEXT_CLASS, "mt-4 max-w-xl")}
              dangerouslySetInnerHTML={{ __html: property.description }}
            />
            <Button asChild className="mt-6" size="lg">
              <a href="#rooms">Book your stay</a>
            </Button>
          </div>
        </div>
      </HeroSlider>

      <div className="relative mx-auto -mt-12 mb-10 max-w-6xl px-4 sm:-mt-16 sm:mb-12 sm:px-6">
        <div className="flex flex-wrap gap-x-3 gap-y-3 rounded-2xl border border-border bg-card/95 p-5 shadow-xl backdrop-blur-md sm:p-6 justify-center">
          {property.amenities.map((amenity) => (
            <span
              key={amenity}
              className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-sm text-foreground/80"
            >
              <AmenityIcon label={amenity} className="size-4 text-primary" /> {amenity}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionDivider seed={0} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Gallery</h2>
        <div className="mt-5">
          <PropertyGallery slug={property.slug} name={property.name} images={property.images} />
        </div>
      </section>

      <section id="rooms" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Rooms & rates</h2>
        <div className="mt-5 flex flex-col gap-4">
          {rooms.map((room) => (
            <RoomTypeCard
              key={room._id.toString()}
              propertySlug={property.slug}
              room={{
                id: room._id.toString(),
                name: room.name,
                maxOccupancy: room.maxOccupancy,
                pricingModel: room.pricingModel,
                basePriceB2C: room.basePriceB2C,
                images: room.images,
              }}
            />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionDivider seed={1} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Policies</h2>
        <div className="mt-5">
          <PoliciesSection policies={property.policies} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Location</h2>
        <div className="mt-5">
          <MapPlaceholder address={property.address} seedKey={property.slug} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Guest reviews</h2>
        <div className="mt-5">
          <ReviewsSection propertyId={property._id.toString()} />
        </div>
      </section>
    </div>
  );
}
