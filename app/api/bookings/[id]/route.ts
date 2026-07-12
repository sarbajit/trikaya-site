import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

  const isOwner =
    (session.user.role === "customer" && booking.userId?.toString() === session.user.id) ||
    (session.user.role === "agent" && booking.agentId?.toString() === session.user.id);
  if (!isOwner && session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [property, roomType] = await Promise.all([
    Property.findById(booking.propertyId).select("name slug"),
    RoomType.findById(booking.roomTypeId).select("name"),
  ]);

  return NextResponse.json({
    bookingId: booking._id.toString(),
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    checkIn: formatISODate(booking.checkIn),
    checkOut: formatISODate(booking.checkOut),
    guests: booking.guests,
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    propertyName: property?.name ?? null,
    propertySlug: property?.slug ?? null,
    roomTypeName: roomType?.name ?? null,
  });
}
