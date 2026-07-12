import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { parseISODate } from "@/lib/date-helpers";
import { availabilityBulkActionSchema } from "@/lib/validation/availability";
import { Availability } from "@/models/Availability";
import { RoomType } from "@/models/RoomType";

/**
 * Bulk block/unblock semantics: "block" sets a date to fully unavailable
 * (blocked = totalUnits - booked, so no remaining sellable units); "unblock"
 * clears the block (blocked = 0). This is a binary per-date state rather
 * than an incrementing counter, matching the "manual block/unblock" control
 * described in spec §5.6 for properties without a channel-manager connection.
 */
export async function POST(request: Request, { params }: { params: Promise<{ roomTypeId: string }> }) {
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

  const json = await request.json().catch(() => null);
  const parsed = availabilityBulkActionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = [];
  for (const dateStr of parsed.data.dates) {
    const date = parseISODate(dateStr);
    if (!date) continue;

    const existing = await Availability.findOne({ roomTypeId, date });
    const totalUnits = existing?.totalUnits ?? roomType.totalInventory;
    const booked = existing?.booked ?? 0;
    const blocked = parsed.data.action === "block" ? Math.max(0, totalUnits - booked) : 0;

    const doc = await Availability.findOneAndUpdate(
      { roomTypeId, date },
      { $set: { blocked }, $setOnInsert: { totalUnits, booked } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    updated.push({ date: dateStr, totalUnits: doc.totalUnits, booked: doc.booked, blocked: doc.blocked });
  }

  return NextResponse.json({ roomTypeId, action: parsed.data.action, updated });
}
