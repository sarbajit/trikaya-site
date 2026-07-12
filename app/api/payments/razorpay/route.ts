import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { formatISODate } from "@/lib/date-helpers";
import { getRoomTypeQuote } from "@/lib/pricing";
import { createOrder } from "@/lib/razorpay";
import { createPaymentOrderSchema } from "@/lib/validation/booking";
import { Booking } from "@/models/Booking";

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "customer" && session?.user?.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createPaymentOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const booking = await Booking.findById(parsed.data.bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isOwner =
    (session.user.role === "customer" && booking.userId?.toString() === session.user.id) ||
    (session.user.role === "agent" && booking.agentId?.toString() === session.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (booking.status !== "pending" || booking.paymentStatus !== "pending") {
    return NextResponse.json({ error: "Booking is not payable" }, { status: 409 });
  }

  const quote = await getRoomTypeQuote({
    roomTypeId: booking.roomTypeId.toString(),
    checkIn: formatISODate(booking.checkIn),
    checkOut: formatISODate(booking.checkOut),
    guests: booking.guests,
    session,
  });
  if (!quote.isAvailable) {
    return NextResponse.json({ error: "Room is no longer available for these dates" }, { status: 409 });
  }

  const amountPaise = Math.round(booking.totalAmount * 100);
  const order = await createOrder({
    amountPaise,
    currency: booking.currency,
    receipt: booking._id.toString(),
  });

  booking.razorpay = { ...booking.razorpay, orderId: order.id };
  await booking.save();

  return NextResponse.json({
    bookingId: booking._id.toString(),
    razorpayOrderId: order.id,
    amountPaise,
    currency: booking.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
