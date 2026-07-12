import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { roomTypeSchema } from "@/lib/validation/roomType";
import { Availability } from "@/models/Availability";
import { RatePlan } from "@/models/RatePlan";
import { RoomType } from "@/models/RoomType";

export async function PUT(request: Request, { params }: { params: Promise<{ roomTypeId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { roomTypeId } = await params;
  const existing = await RoomType.findById(roomTypeId);
  if (!existing) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  // propertyId is never taken from the client on update — a room type stays
  // attached to whichever property it was created under.
  const parsed = roomTypeSchema.safeParse({ ...json, propertyId: existing.propertyId.toString() });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let updated;
  try {
    updated = await RoomType.findByIdAndUpdate(roomTypeId, { $set: parsed.data }, { new: true });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: { formErrors: ["A room type with this name already exists for this property"], fieldErrors: {} } },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ roomTypeId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { roomTypeId } = await params;
  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  await RatePlan.deleteMany({ roomTypeId });
  await Availability.deleteMany({ roomTypeId });
  await RoomType.findByIdAndDelete(roomTypeId);

  return NextResponse.json({ success: true });
}
