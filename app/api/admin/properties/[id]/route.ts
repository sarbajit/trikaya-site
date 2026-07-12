import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { propertySchema } from "@/lib/validation/property";
import { Availability } from "@/models/Availability";
import { Property } from "@/models/Property";
import { RatePlan } from "@/models/RatePlan";
import { RoomType } from "@/models/RoomType";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = propertySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await Property.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const previousSlug = existing.slug;

  let updated;
  try {
    updated = await Property.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: { formErrors: ["A property with this slug already exists"], fieldErrors: {} } },
        { status: 409 }
      );
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath("/admin/properties");
  revalidatePath(`/properties/${previousSlug}`);
  if (updated && updated.slug !== previousSlug) {
    revalidatePath(`/properties/${updated.slug}`);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const property = await Property.findById(id);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Hard cascade delete: Property/RoomType/RatePlan/Availability carry no
  // personal data, unlike Users/Bookings (spec §5.11 anonymizes those instead).
  // TODO(Phase 7+): once bookings exist, guard against deleting room types
  // with live bookings (block delete or require isActive:false instead).
  const roomTypes = await RoomType.find({ propertyId: id }).select("_id");
  const roomTypeIds = roomTypes.map((rt) => rt._id);

  await RatePlan.deleteMany({ roomTypeId: { $in: roomTypeIds } });
  await Availability.deleteMany({ roomTypeId: { $in: roomTypeIds } });
  await RoomType.deleteMany({ propertyId: id });
  await Property.findByIdAndDelete(id);

  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath("/admin/properties");
  revalidatePath(`/properties/${property.slug}`);

  return NextResponse.json({ success: true });
}
