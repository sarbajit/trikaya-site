import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { isGooglePlacesConfigured } from "@/lib/google-places";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { PropertyForm, type PropertyFormData } from "../../_components/PropertyForm";
import { RoomTypesSection } from "../../_components/RoomTypesSection";
import { PageHeader } from "../../../_components/PageHeader";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const property = await Property.findById(id);
  if (!property) {
    notFound();
  }

  const roomTypes = await RoomType.find({ propertyId: id }).sort({ name: 1 });
  const initialRoomTypes = roomTypes.map((roomType) => ({
    id: roomType._id.toString(),
    name: roomType.name,
    pricingModel: roomType.pricingModel,
    basePriceB2C: roomType.basePriceB2C,
    basePriceB2B: roomType.basePriceB2B,
    totalInventory: roomType.totalInventory,
  }));

  const initialData: PropertyFormData = {
    name: property.name,
    slug: property.slug,
    destination: property.destination,
    address: property.address,
    geoLat: property.geo ? String(property.geo.lat) : "",
    geoLng: property.geo ? String(property.geo.lng) : "",
    description: property.description,
    propertyType: property.propertyType,
    amenities: [...property.amenities],
    images: property.images.map((image) => ({ url: image.url, alt: image.alt })),
    starRating: property.starRating ? String(property.starRating) : "",
    googlePlaceId: property.googlePlaceId ?? "",
    googleRating: property.googleRating != null ? String(property.googleRating) : "",
    checkIn: property.policies?.checkIn ?? "",
    checkOut: property.policies?.checkOut ?? "",
    houseRules: property.policies?.houseRules ?? "",
    isActive: property.isActive,
    homepageMode: property.homepageMode,
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${property.name}`} />
      <PropertyForm
        initialData={initialData}
        propertyId={property._id.toString()}
        googlePlacesConfigured={isGooglePlacesConfigured()}
        googleRatingCount={property.googleRatingCount}
        googleRatingUpdatedAt={property.googleRatingUpdatedAt?.toISOString()}
      />
      <RoomTypesSection propertyId={property._id.toString()} initialRoomTypes={initialRoomTypes} />
    </div>
  );
}
