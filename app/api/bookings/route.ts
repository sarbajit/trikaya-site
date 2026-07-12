import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { parseISODate } from "@/lib/date-helpers";
import { getRoomTypeQuote, InvalidQuoteRequestError, RoomTypeNotFoundError } from "@/lib/pricing";
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

  const { roomTypeId, checkIn, checkOut, guests } = parsed.data;

  let quote;
  try {
    quote = await getRoomTypeQuote({ roomTypeId, checkIn, checkOut, guests, session });
  } catch (error) {
    if (error instanceof RoomTypeNotFoundError) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }
    if (error instanceof InvalidQuoteRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  if (quote.guestsExceedOccupancy) {
    return NextResponse.json({ error: "Guests exceed room occupancy" }, { status: 400 });
  }
  if (!quote.isAvailable) {
    return NextResponse.json({ error: "Room is not available for the selected dates" }, { status: 409 });
  }

  await connectDB();

  const booking = await Booking.create({
    userId: session.user.role === "customer" ? session.user.id : undefined,
    agentId: session.user.role === "agent" ? session.user.id : undefined,
    propertyId: quote.propertyId,
    roomTypeId,
    checkIn: parseISODate(checkIn),
    checkOut: parseISODate(checkOut),
    guests,
    pricingModelUsed: quote.pricingModel,
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
