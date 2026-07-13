import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { RoomType } from "@/models/RoomType";
import { RatePlanForm } from "@/app/admin/room-types/_components/RatePlanForm";
import { PageHeader } from "@/app/admin/_components/PageHeader";

export default async function NewRatePlanPage({ params }: { params: Promise<{ roomTypeId: string }> }) {
  await connectDB();
  const { roomTypeId } = await params;
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`New rate plan for ${roomType.name}`} />
      <RatePlanForm roomTypeId={roomTypeId} />
    </div>
  );
}
