import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { ratePlanSchema } from "@/lib/validation/ratePlan";
import { RatePlan } from "@/models/RatePlan";
import { RoomType } from "@/models/RoomType";

export async function POST(request: Request, { params }: { params: Promise<{ roomTypeId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { roomTypeId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = ratePlanSchema.safeParse({ ...json, roomTypeId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const roomType = await RoomType.findById(roomTypeId);
  if (!roomType) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  let ratePlan;
  try {
    ratePlan = await RatePlan.create({
      ...parsed.data,
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      label: parsed.data.label || undefined,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: { formErrors: ["A rate plan with this label already exists for this room type"], fieldErrors: {} } },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json(ratePlan, { status: 201 });
}
