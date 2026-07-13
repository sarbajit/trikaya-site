import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { parseISODate } from "@/lib/date-helpers";
import { sendBookingRequestedEmail } from "@/lib/email";
import { getBookingQuote, InvalidQuoteRequestError, RoomTypeNotFoundError } from "@/lib/pricing";
import { requestToBookSchema } from "@/lib/validation/booking";
import { Booking } from "@/models/Booking";
import { Property } from "@/models/Property";
import { getSiteSettings } from "@/models/SiteSettings";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "customer" && session?.user?.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = requestToBookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { checkIn, checkOut, rooms, guestNote } = parsed.data;

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
    paymentStatus: "awaiting_offline",
    status: "requested",
    source: "website",
    guestNote,
  });

  try {
    const settings = await getSiteSettings();
    if (settings.contactRecipientEmail && session.user.email && session.user.name) {
      const property = await Property.findById(quote.propertyId).select("name");
      await sendBookingRequestedEmail({
        to: settings.contactRecipientEmail,
        guestName: session.user.name,
        guestEmail: session.user.email,
        propertyName: property?.name ?? "Property",
        checkIn,
        checkOut,
        rooms: quote.rooms.map((room) => ({
          roomTypeName: room.roomTypeName,
          adults: room.adults,
          childAges: room.childAges,
        })),
        totalAmount: quote.totalAmount,
        currency: quote.currency,
        guestNote,
        adminUrl: `${process.env.NEXTAUTH_URL}/admin/bookings/${booking._id.toString()}`,
      });
    }
  } catch (error) {
    console.error("Failed to send booking request notification email", error);
  }

  return NextResponse.json({ bookingId: booking._id.toString() }, { status: 201 });
}
