import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { reserveInventoryForBooking } from "@/lib/booking-inventory";
import { connectDB } from "@/lib/db";
import { adminBookingEditSchema, adminBookingRequestActionSchema } from "@/lib/validation/booking";
import { Booking } from "@/models/Booking";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const json = await request.json().catch(() => null);

  // Internal metadata edits (Booking Source / Notes) are not workflow actions —
  // handle them separately, without the "requested"-only gate below.
  if (!(json && typeof json === "object" && "action" in json)) {
    const editParsed = adminBookingEditSchema.safeParse(json);
    if (!editParsed.success) {
      return NextResponse.json({ error: editParsed.error.flatten() }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (editParsed.data.source !== undefined) {
      booking.source = editParsed.data.source;
    }
    if (editParsed.data.internalNotes !== undefined) {
      booking.internalNotes = editParsed.data.internalNotes;
    }
    await booking.save();

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);

    return NextResponse.json(booking);
  }

  const parsed = adminBookingRequestActionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await Booking.findById(id);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "requested") {
    return NextResponse.json({ error: "This booking is not awaiting review" }, { status: 409 });
  }

  if (parsed.data.action === "reject") {
    booking.status = "cancelled";
    await booking.save();
    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${id}`);
    return NextResponse.json(booking);
  }

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
    return NextResponse.json(
      {
        error:
          "Not enough availability to confirm this booking for the requested dates. Check the calendar and pick different rooms/dates.",
      },
      { status: 409 }
    );
  }

  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.createdBy = new Types.ObjectId(session.user.id);
  await booking.save();

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/account/bookings");

  return NextResponse.json(booking);
}
