import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createAdminManagedUser, DuplicateEmailError } from "@/lib/admin-customer-creation";
import { reserveInventoryForBooking } from "@/lib/booking-inventory";
import { connectDB } from "@/lib/db";
import { parseISODate } from "@/lib/date-helpers";
import { getClientIp } from "@/lib/http";
import { getBookingQuote, InvalidQuoteRequestError, RoomTypeNotFoundError } from "@/lib/pricing";
import { adminManualBookingSchema } from "@/lib/validation/booking";
import { Booking } from "@/models/Booking";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = adminManualBookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { propertyId, checkIn, checkOut, rooms, customerMode, userId, newCustomer } = parsed.data;

  let quote;
  try {
    // session: null forces B2C pricing — an admin-entered phone/walk-in
    // booking is never a B2B agent rate.
    quote = await getBookingQuote({ checkIn, checkOut, rooms, session: null });
  } catch (error) {
    if (error instanceof RoomTypeNotFoundError) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }
    if (error instanceof InvalidQuoteRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  if (quote.propertyId !== propertyId) {
    return NextResponse.json({ error: "All rooms must belong to the selected property" }, { status: 400 });
  }

  const occupancyError = quote.rooms.find((r) => r.occupancyError)?.occupancyError;
  if (occupancyError) {
    return NextResponse.json({ error: occupancyError }, { status: 400 });
  }
  if (!quote.isAvailable) {
    return NextResponse.json({ error: "Rooms are not available for the selected dates" }, { status: 409 });
  }

  let customerId = userId;
  if (customerMode === "new" && newCustomer) {
    try {
      const user = await createAdminManagedUser(
        {
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          role: "customer",
          loginEnabled: true,
        },
        getClientIp(request)
      );
      customerId = user._id.toString();
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return NextResponse.json(
          { error: { formErrors: [], fieldErrors: { "newCustomer.email": ["Email already registered"] } } },
          { status: 409 }
        );
      }
      throw error;
    }
  }

  const booking = new Booking({
    userId: customerId,
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
    paymentStatus: "paid",
    status: "confirmed",
    source: "manual",
    createdBy: session.user.id,
  });

  const conn = await connectDB();
  const dbSession = await conn.startSession();

  let soldOut = false;
  try {
    await dbSession.withTransaction(async () => {
      await reserveInventoryForBooking(booking, dbSession);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SOLD_OUT") {
      soldOut = true;
    } else {
      throw error;
    }
  } finally {
    await dbSession.endSession();
  }

  if (soldOut) {
    // The new-customer User row (if any) is left in place — the admin can
    // retry with customerMode "existing" once they pick different dates/rooms.
    return NextResponse.json({ error: "Not enough availability for the selected rooms/dates." }, { status: 409 });
  }

  await booking.save();

  revalidatePath("/admin/bookings");
  revalidatePath("/account/bookings");

  return NextResponse.json({ bookingId: booking._id.toString() }, { status: 201 });
}
