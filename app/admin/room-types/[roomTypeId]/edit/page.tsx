import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { RoomType } from "@/models/RoomType";
import { Button } from "@/components/ui/button";
import { RoomTypeForm, type RoomTypeFormData } from "../../_components/RoomTypeForm";

export default async function EditRoomTypePage({ params }: { params: Promise<{ roomTypeId: string }> }) {
  await connectDB();
  const { roomTypeId } = await params;
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    notFound();
  }

  const initialData: RoomTypeFormData = {
    name: roomType.name,
    maxOccupancy: String(roomType.maxOccupancy),
    pricingModel: roomType.pricingModel,
    basePriceB2C: String(roomType.basePriceB2C),
    basePriceB2B: String(roomType.basePriceB2B),
    images: roomType.images.map((image) => ({ url: image.url, alt: image.alt })),
    totalInventory: String(roomType.totalInventory),
  };

  const propertyId = roomType.propertyId.toString();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/admin/properties/${propertyId}/edit`} className="text-sm text-muted-foreground hover:underline">
        &larr; Back to property
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Edit {roomType.name}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/room-types/${roomTypeId}/rate-plans`}>Rate plans</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/room-types/${roomTypeId}/availability`}>Availability</Link>
          </Button>
        </div>
      </div>
      <RoomTypeForm propertyId={propertyId} initialData={initialData} roomTypeId={roomTypeId} />
    </main>
  );
}
