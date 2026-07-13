import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";
import { RoomTypeForm } from "@/app/admin/room-types/_components/RoomTypeForm";
import { PageHeader } from "@/app/admin/_components/PageHeader";

export default async function NewRoomTypePage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const property = await Property.findById(id);
  if (!property) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`New room type for ${property.name}`} />
      <RoomTypeForm propertyId={id} />
    </div>
  );
}
