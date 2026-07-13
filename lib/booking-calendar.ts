import { enumerateNights, formatISODate } from "@/lib/date-helpers";
import { resolveAvailableUnits } from "@/lib/pricing";
import { Availability } from "@/models/Availability";
import { Booking } from "@/models/Booking";
import { RoomType } from "@/models/RoomType";

export type DayStatus = "available" | "partial" | "full";

export interface DayAggregate {
  status: DayStatus;
  totalUnits: number;
  availableUnits: number;
}

export interface DayBookingSummary {
  id: string;
  guestName: string;
  rooms: { roomTypeName: string; adults: number; childAges: number[] }[];
}

/**
 * Computes, for every date in [rangeStart, rangeEnd), the aggregated
 * available/total room-night capacity across a property's room types (or a
 * single room type if roomTypeId is given), plus the list of confirmed
 * bookings touching that date. Shared by the month/week/year calendar views
 * so the aggregation logic exists in exactly one place.
 */
export async function computeCalendarDayData(params: {
  propertyId: string;
  roomTypeId?: string;
  rangeStart: Date;
  rangeEnd: Date;
}): Promise<{
  dayAggregateByIso: Map<string, DayAggregate>;
  dayBookingsByIso: Map<string, DayBookingSummary[]>;
}> {
  const { propertyId, roomTypeId, rangeStart, rangeEnd } = params;

  const roomTypeQuery = roomTypeId ? { _id: roomTypeId } : { propertyId };
  const roomTypes = await RoomType.find(roomTypeQuery).select("name totalInventory");
  const roomTypeIds = roomTypes.map((rt) => rt._id.toString());
  const totalInventoryByRoomType = new Map(roomTypes.map((rt) => [rt._id.toString(), rt.totalInventory]));
  const roomTypeNameById = new Map(roomTypes.map((rt) => [rt._id.toString(), rt.name]));

  const availabilityDocs =
    roomTypeIds.length > 0
      ? await Availability.find({
          roomTypeId: { $in: roomTypeIds },
          date: { $gte: rangeStart, $lt: rangeEnd },
        })
      : [];
  const availabilityByKey = new Map(
    availabilityDocs.map((doc) => [`${doc.roomTypeId.toString()}|${formatISODate(doc.date)}`, doc])
  );

  const dayAggregateByIso = new Map<string, DayAggregate>();
  for (let cursor = rangeStart; cursor.getTime() < rangeEnd.getTime(); cursor = new Date(cursor.getTime() + 86_400_000)) {
    const iso = formatISODate(cursor);
    let totalUnits = 0;
    let availableUnits = 0;
    for (const rtId of roomTypeIds) {
      const inventory = totalInventoryByRoomType.get(rtId)!;
      const doc = availabilityByKey.get(`${rtId}|${iso}`);
      totalUnits += doc?.totalUnits ?? inventory;
      availableUnits += resolveAvailableUnits(doc, inventory);
    }
    const status: DayStatus = totalUnits === 0 || availableUnits <= 0 ? "full" : availableUnits >= totalUnits ? "available" : "partial";
    dayAggregateByIso.set(iso, { status, totalUnits, availableUnits });
  }

  const bookingQuery: Record<string, unknown> = {
    propertyId,
    status: { $in: ["confirmed", "completed"] },
    checkIn: { $lt: rangeEnd },
    checkOut: { $gt: rangeStart },
  };
  if (roomTypeId) {
    bookingQuery["rooms.roomTypeId"] = roomTypeId;
  }

  const bookings = await Booking.find(bookingQuery)
    .populate("userId", "name")
    .populate("agentId", "contactPerson");

  const dayBookingsByIso = new Map<string, DayBookingSummary[]>();
  for (const booking of bookings) {
    const user = booking.userId as unknown as { name?: string } | null;
    const agent = booking.agentId as unknown as { contactPerson?: string } | null;
    const guestName = user?.name ?? agent?.contactPerson ?? "Guest";

    const relevantRooms = roomTypeId ? booking.rooms.filter((r) => r.roomTypeId.toString() === roomTypeId) : booking.rooms;
    const summary: DayBookingSummary = {
      id: booking._id.toString(),
      guestName,
      rooms: relevantRooms.map((r) => ({
        roomTypeName: roomTypeNameById.get(r.roomTypeId.toString()) ?? "Room",
        adults: r.adults,
        childAges: r.childAges,
      })),
    };

    const nights = enumerateNights(booking.checkIn, booking.checkOut);
    for (const night of nights) {
      const iso = formatISODate(night);
      if (night.getTime() < rangeStart.getTime() || night.getTime() >= rangeEnd.getTime()) continue;
      const list = dayBookingsByIso.get(iso) ?? [];
      list.push(summary);
      dayBookingsByIso.set(iso, list);
    }
  }

  return { dayAggregateByIso, dayBookingsByIso };
}
