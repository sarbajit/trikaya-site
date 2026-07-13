import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { parseISODate } from "@/lib/date-helpers";
import { getBookingQuote, InvalidQuoteRequestError, RoomTypeNotFoundError } from "@/lib/pricing";
import { createBookingSchema } from "@/lib/validation/booking";
import { Booking } from "@/models/Booking";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "customer" && session?.user?.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { checkIn, checkOut, rooms } = parsed.data;

  let quote;
  try {
    quote = await getBookingQuote({ checkIn, checkOut, rooms, session });
  } catch (error) {
    if (error instanceof RoomTypeNotFoundError) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }
    if (error instanceof InvalidQuoteRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const occupancyError = quote.rooms.find((r) => r.occupancyError)?.occupancyError;
  if (occupancyError) {
    return NextResponse.json({ error: occupancyError }, { status: 400 });
  }
  if (!quote.isAvailable) {
    return NextResponse.json({ error: "Rooms are not available for the selected dates" }, { status: 409 });
  }

  await connectDB();

  const booking = await Booking.create({
    userId: session.user.role === "customer" ? session.user.id : undefined,
    agentId: session.user.role === "agent" ? session.user.id : undefined,
    propertyId: quote.propertyId,
    checkIn: parseISODate(checkIn),
    checkOut: parseISODate(checkOut),
    rooms: quote.rooms.map((room) => ({
      roomTypeId: room.roomTypeId,
      pricingModel: room.pricingModel,
      adults: room.adults,
      childAges: room.childAges,
      nightlyRates: room.nightlyRates.map((night) => ({
        date: night.date,
        adultRate: night.adultRate,
        childRate: night.childRate,
        amount: night.amount,
      })),
      roomTotal: room.roomTotal,
    })),
    totalAmount: quote.totalAmount,
    currency: quote.currency,
    paymentStatus: "pending",
    status: "pending",
    source: "website",
  });

  return NextResponse.json(
    {
      bookingId: booking._id.toString(),
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      nights: quote.nights,
      checkIn,
      checkOut,
    },
    { status: 201 }
  );
}
