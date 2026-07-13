import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessBooking } from "@/lib/booking-authorization";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { Booking } from "@/models/Booking";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();
  const booking = await Booking.findById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!canAccessBooking(session, booking)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roomTypeIds = [...new Set(booking.rooms.map((room) => String(room.roomTypeId)))];
  const [property, roomTypes] = await Promise.all([
    Property.findById(booking.propertyId).select("name slug"),
    RoomType.find({ _id: { $in: roomTypeIds } }).select("name"),
  ]);
  const roomTypeNameById = new Map(roomTypes.map((rt) => [String(rt._id), rt.name]));

  return NextResponse.json({
    bookingId: booking._id.toString(),
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    checkIn: formatISODate(booking.checkIn),
    checkOut: formatISODate(booking.checkOut),
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    propertyName: property?.name ?? null,
    propertySlug: property?.slug ?? null,
    rooms: booking.rooms.map((room) => ({
      roomTypeName: roomTypeNameById.get(String(room.roomTypeId)) ?? null,
      adults: room.adults,
      childAges: room.childAges,
      roomTotal: room.roomTotal,
    })),
  });
}
