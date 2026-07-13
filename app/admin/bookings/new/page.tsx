import { connectDB } from "@/lib/db";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { User } from "@/models/User";
import { PageHeader } from "../../_components/PageHeader";
import { ManualBookingForm } from "../_components/ManualBookingForm";

export default async function NewManualBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; date?: string }>;
}) {
  const { propertyId, date } = await searchParams;

  await connectDB();
  const [properties, roomTypes, customers] = await Promise.all([
    Property.find({ isActive: true }).select("name").sort({ name: 1 }),
    RoomType.find().select("propertyId name maxOccupancy pricingModel"),
    User.find({ role: "customer" }).select("name email").sort({ name: 1 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New booking" description="Create a manual booking for a phone or walk-in guest." />
      <div className="mt-8">
        <ManualBookingForm
          properties={properties.map((p) => ({ id: p._id.toString(), name: p.name }))}
          roomTypes={roomTypes.map((rt) => ({
            id: rt._id.toString(),
            propertyId: rt.propertyId.toString(),
            name: rt.name,
            maxOccupancy: rt.maxOccupancy,
            pricingModel: rt.pricingModel,
          }))}
          customers={customers.map((c) => ({ id: c._id.toString(), name: c.name, email: c.email }))}
          initialPropertyId={propertyId}
          initialDate={date}
        />
      </div>
    </div>
  );
}
