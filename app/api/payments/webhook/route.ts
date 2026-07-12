import { NextResponse } from "next/server";
import type { ClientSession } from "mongoose";
import { connectDB } from "@/lib/db";
import { enumerateNights } from "@/lib/date-helpers";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { Availability } from "@/models/Availability";
import { Booking } from "@/models/Booking";
import { RoomType } from "@/models/RoomType";

/**
 * Reserves one unit of inventory per night inside a transaction. Throws if
 * any night is sold out, so the caller can abort the whole booking rather
 * than leaving a partial reservation. New Availability docs default their
 * totalUnits to the room type's totalInventory (same convention as
 * lib/pricing.ts's resolveAvailableUnits) the first time a date is touched.
 */
async function reserveNights(roomTypeId: string, nights: Date[], totalInventory: number, dbSession: ClientSession) {
  for (const date of nights) {
    const updated = await Availability.findOneAndUpdate(
      { roomTypeId, date, $expr: { $lt: [{ $add: ["$booked", "$blocked"] }, "$totalUnits"] } },
      { $inc: { booked: 1 } },
      { session: dbSession, new: true }
    );
    if (updated) continue;

    const existing = await Availability.findOne({ roomTypeId, date }, null, { session: dbSession });
    if (existing) {
      throw new Error("SOLD_OUT");
    }
    if (totalInventory < 1) {
      throw new Error("SOLD_OUT");
    }
    await Availability.create(
      [{ roomTypeId, date, totalUnits: totalInventory, booked: 1, blocked: 0 }],
      { session: dbSession }
    );
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  if (payload.event !== "payment.captured") {
    return NextResponse.json({ received: true });
  }

  const paymentEntity = payload.payload?.payment?.entity;
  const orderId: string | undefined = paymentEntity?.order_id;
  const paymentId: string | undefined = paymentEntity?.id;
  if (!orderId || !paymentId) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  await connectDB();

  const booking = await Booking.findOne({ "razorpay.orderId": orderId });
  if (!booking) {
    return NextResponse.json({ received: true });
  }

  if (booking.status === "confirmed") {
    return NextResponse.json({ received: true });
  }

  const roomType = await RoomType.findById(booking.roomTypeId);
  if (!roomType) {
    return NextResponse.json({ received: true });
  }

  const nights = enumerateNights(booking.checkIn, booking.checkOut);

  const conn = await connectDB();
  const dbSession = await conn.startSession();

  let soldOut = false;
  try {
    await dbSession.withTransaction(async () => {
      await reserveNights(booking.roomTypeId.toString(), nights, roomType.totalInventory, dbSession);
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
    booking.paymentStatus = "paid";
    booking.razorpay = { ...booking.razorpay, paymentId };
    await booking.save();
    return NextResponse.json({ received: true, soldOut: true });
  }

  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.razorpay = { ...booking.razorpay, paymentId, signature: signatureHeader ?? undefined };
  await booking.save();

  return NextResponse.json({ received: true });
}
