import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { RoomType } from "@/models/RoomType";
import { RatePlanForm } from "@/app/admin/room-types/_components/RatePlanForm";

export default async function NewRatePlanPage({ params }: { params: Promise<{ roomTypeId: string }> }) {
  await connectDB();
  const { roomTypeId } = await params;
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">New rate plan for {roomType.name}</h1>
      <RatePlanForm roomTypeId={roomTypeId} />
    </main>
  );
}
