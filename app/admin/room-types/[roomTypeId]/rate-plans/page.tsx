import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { RatePlan } from "@/models/RatePlan";
import { RoomType } from "@/models/RoomType";
import { Button } from "@/components/ui/button";
import { RatePlansTable } from "../../_components/RatePlansTable";
import { PageHeader } from "@/app/admin/_components/PageHeader";

export default async function RatePlansPage({ params }: { params: Promise<{ roomTypeId: string }> }) {
  await connectDB();
  const { roomTypeId } = await params;
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    notFound();
  }

  const ratePlans = await RatePlan.find({ roomTypeId }).sort({ startDate: 1 });
  const initialRatePlans = ratePlans.map((ratePlan) => ({
    id: ratePlan._id.toString(),
    label: ratePlan.label,
    startDate: formatISODate(ratePlan.startDate),
    endDate: formatISODate(ratePlan.endDate),
    b2cRate: ratePlan.b2cRate,
    b2bRate: ratePlan.b2bRate,
    daysOfWeek: ratePlan.daysOfWeek,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/admin/room-types/${roomTypeId}/edit`} className="text-sm text-muted-foreground hover:underline">
        &larr; Back to {roomType.name}
      </Link>
      <div className="mt-2">
        <PageHeader
          title={`Rate plans — ${roomType.name}`}
          description={
            <>
              Seasonal/date overrides for the base B2C rate of ₹{roomType.basePriceB2C.toLocaleString("en-IN")} and
              B2B rate of ₹{roomType.basePriceB2B.toLocaleString("en-IN")}.
            </>
          }
          actions={
            <Button asChild>
              <Link href={`/admin/room-types/${roomTypeId}/rate-plans/new`}>Add rate plan</Link>
            </Button>
          }
        />
      </div>
      <RatePlansTable initialRatePlans={initialRatePlans} />
    </div>
  );
}
