import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/mongo-errors";
import { ratePlanSchema } from "@/lib/validation/ratePlan";
import { RatePlan } from "@/models/RatePlan";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const existing = await RatePlan.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  // roomTypeId is never taken from the client on update — a rate plan stays
  // attached to whichever room type it was created under.
  const parsed = ratePlanSchema.safeParse({ ...json, roomTypeId: existing.roomTypeId.toString() });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let updated;
  try {
    updated = await RatePlan.findByIdAndUpdate(
      id,
      {
        $set: {
          ...parsed.data,
          startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
          endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
          label: parsed.data.label || undefined,
        },
      },
      { new: true }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: { formErrors: ["A rate plan with this label already exists for this room type"], fieldErrors: {} } },
        { status: 409 }
      );
    }
    throw error;
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
  const ratePlan = await RatePlan.findByIdAndDelete(id);
  if (!ratePlan) {
    return NextResponse.json({ error: "Rate plan not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
