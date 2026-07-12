import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { roomTypeSchema } from "@/lib/validation/roomType";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id: propertyId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = roomTypeSchema.safeParse({ ...json, propertyId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  let roomType;
  try {
    roomType = await RoomType.create(parsed.data);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: { formErrors: ["A room type with this name already exists for this property"], fieldErrors: {} } },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json(roomType, { status: 201 });
}
