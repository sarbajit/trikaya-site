import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";
import { RoomTypeForm } from "@/app/admin/room-types/_components/RoomTypeForm";

export default async function NewRoomTypePage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const property = await Property.findById(id);
  if (!property) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">New room type for {property.name}</h1>
      <RoomTypeForm propertyId={id} />
    </main>
  );
}
