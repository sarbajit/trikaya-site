import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { RatePlan } from "@/models/RatePlan";
import { RatePlanForm, type RatePlanFormData } from "@/app/admin/room-types/_components/RatePlanForm";

export default async function EditRatePlanPage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const ratePlan = await RatePlan.findById(id);
  if (!ratePlan) {
    notFound();
  }

  const roomTypeId = ratePlan.roomTypeId.toString();
  const initialData: RatePlanFormData = {
    label: ratePlan.label ?? "",
    startDate: formatISODate(ratePlan.startDate),
    endDate: formatISODate(ratePlan.endDate),
    b2cRate: String(ratePlan.b2cRate),
    b2bRate: String(ratePlan.b2bRate),
    daysOfWeek: ratePlan.daysOfWeek ?? [],
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href={`/admin/room-types/${roomTypeId}/rate-plans`} className="text-sm text-muted-foreground hover:underline">
        &larr; Back to rate plans
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Edit rate plan</h1>
      <RatePlanForm roomTypeId={roomTypeId} initialData={initialData} ratePlanId={id} />
    </main>
  );
}
