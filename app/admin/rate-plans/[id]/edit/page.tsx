import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { RatePlan } from "@/models/RatePlan";
import { RatePlanForm, type RatePlanFormData } from "@/app/admin/room-types/_components/RatePlanForm";
import { PageHeader } from "@/app/admin/_components/PageHeader";

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
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin/room-types/${roomTypeId}/rate-plans`} className="text-sm text-muted-foreground hover:underline">
        &larr; Back to rate plans
      </Link>
      <div className="mt-2">
        <PageHeader title="Edit rate plan" />
      </div>
      <RatePlanForm roomTypeId={roomTypeId} initialData={initialData} ratePlanId={id} />
    </div>
  );
}
