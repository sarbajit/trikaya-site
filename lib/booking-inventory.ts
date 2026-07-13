import type { ClientSession } from "mongoose";
import { enumerateNights } from "@/lib/date-helpers";
import { Availability } from "@/models/Availability";
import type { IBooking } from "@/models/Booking";
import { RoomType } from "@/models/RoomType";

/**
 * Reserves `count` units of inventory per night inside a transaction. Throws
 * an Error with message "SOLD_OUT" if any night can't cover the requested
 * count, so the caller can abort the whole booking rather than leaving a
 * partial reservation. New Availability docs default their totalUnits to the
 * room type's totalInventory (same convention as lib/pricing.ts's
 * resolveAvailableUnits) the first time a date is touched.
 */
async function reserveRoomTypeNights(
  roomTypeId: string,
  nights: Date[],
  count: number,
  totalInventory: number,
  dbSession: ClientSession
) {
  for (const date of nights) {
    const updated = await Availability.findOneAndUpdate(
      {
        roomTypeId,
        date,
        $expr: { $lte: [{ $add: ["$booked", "$blocked", count] }, "$totalUnits"] },
      },
      { $inc: { booked: count } },
      { session: dbSession, new: true }
    );
    if (updated) continue;

    const existing = await Availability.findOne({ roomTypeId, date }, null, { session: dbSession });
    if (existing) {
      throw new Error("SOLD_OUT");
    }
    if (totalInventory < count) {
      throw new Error("SOLD_OUT");
    }
    await Availability.create(
      [{ roomTypeId, date, totalUnits: totalInventory, booked: count, blocked: 0 }],
      { session: dbSession }
    );
  }
}

/**
 * Atomically reserves inventory for every room/night in a booking, inside
 * the caller's transaction. Shared by the Razorpay webhook, the manual
 * admin-booking route, and the Request-to-Book confirmation route so the
 * conditional-increment logic exists in exactly one place. Throws
 * Error("SOLD_OUT") if any room type is oversold for any night.
 */
export async function reserveInventoryForBooking(
  booking: Pick<IBooking, "rooms" | "checkIn" | "checkOut">,
  dbSession: ClientSession
): Promise<void> {
  const countByRoomType = new Map<string, number>();
  for (const room of booking.rooms) {
    const key = String(room.roomTypeId);
    countByRoomType.set(key, (countByRoomType.get(key) ?? 0) + 1);
  }

  const roomTypes = await RoomType.find({ _id: { $in: [...countByRoomType.keys()] } });
  if (roomTypes.length !== countByRoomType.size) {
    throw new Error("SOLD_OUT");
  }
  const totalInventoryByRoomType = new Map(roomTypes.map((rt) => [String(rt._id), rt.totalInventory]));

  const nights = enumerateNights(booking.checkIn, booking.checkOut);

  for (const [roomTypeId, count] of countByRoomType) {
    await reserveRoomTypeNights(roomTypeId, nights, count, totalInventoryByRoomType.get(roomTypeId)!, dbSession);
  }
}
