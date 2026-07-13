import { NextResponse } from "next/server";
import type { ClientSession } from "mongoose";
import { connectDB } from "@/lib/db";
import { enumerateNights, formatISODate } from "@/lib/date-helpers";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createSwipeInvoice, getSwipeInvoicePdf } from "@/lib/swipe";
import { Agent } from "@/models/Agent";
import { Availability } from "@/models/Availability";
import { Booking, type IBooking } from "@/models/Booking";
import { Property } from "@/models/Property";
import { RoomType } from "@/models/RoomType";
import { User } from "@/models/User";

/**
 * Creates the Swipe invoice, fetches its PDF, and emails the confirmation.
 * Deliberately isolated from the caller's control flow: the booking is
 * already confirmed and paid by the time this runs, so a Swipe/email failure
 * here must only be logged, never roll back or fail the webhook response.
 */
async function generateAndSendInvoice(booking: IBooking): Promise<void> {
  const property = await Property.findById(booking.propertyId).select("name");
  if (!property) return;

  const roomTypeIds = [...new Set(booking.rooms.map((room) => String(room.roomTypeId)))];
  const roomTypes = await RoomType.find({ _id: { $in: roomTypeIds } }).select("name");
  const roomTypeNames = new Map(roomTypes.map((rt) => [String(rt._id), rt.name]));

  const buyer = booking.userId
    ? await User.findById(booking.userId).select("name email phone")
    : await Agent.findById(booking.agentId).select("businessName contactPerson email phone gstin");
  if (!buyer) return;

  const buyerName = "name" in buyer ? buyer.name : buyer.businessName;
  const buyerEmail = buyer.email;

  const result = await createSwipeInvoice({
    booking,
    property,
    roomTypeNames,
    buyer: {
      id: String(buyer._id),
      name: buyerName,
      email: buyerEmail,
      phone: buyer.phone,
      gstin: "gstin" in buyer ? buyer.gstin : undefined,
    },
  });
  if (!result) return;

  booking.invoiceNumber = result.serialNumber;
  booking.swipeInvoiceId = result.hashId;
  await booking.save();

  const pdf = await getSwipeInvoicePdf(result.hashId);

  await sendBookingConfirmationEmail({
    to: buyerEmail,
    guestName: "name" in buyer ? buyer.name : buyer.contactPerson,
    propertyName: property.name,
    roomTypeName: roomTypes.map((rt) => rt.name).join(", "),
    checkIn: formatISODate(booking.checkIn),
    checkOut: formatISODate(booking.checkOut),
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    accountUrl: `${process.env.NEXTAUTH_URL}/account/bookings/${booking._id}`,
    invoicePdf: pdf ?? undefined,
    invoiceNumber: result.serialNumber,
  });
}

/**
 * Reserves `count` units of inventory per night inside a transaction. Throws
 * if any night can't cover the requested count, so the caller can abort the
 * whole booking rather than leaving a partial reservation. New Availability
 * docs default their totalUnits to the room type's totalInventory (same
 * convention as lib/pricing.ts's resolveAvailableUnits) the first time a
 * date is touched.
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

  const countByRoomType = new Map<string, number>();
  for (const room of booking.rooms) {
    const key = String(room.roomTypeId);
    countByRoomType.set(key, (countByRoomType.get(key) ?? 0) + 1);
  }

  const roomTypes = await RoomType.find({ _id: { $in: [...countByRoomType.keys()] } });
  if (roomTypes.length !== countByRoomType.size) {
    return NextResponse.json({ received: true });
  }
  const totalInventoryByRoomType = new Map(roomTypes.map((rt) => [String(rt._id), rt.totalInventory]));

  const nights = enumerateNights(booking.checkIn, booking.checkOut);

  const conn = await connectDB();
  const dbSession = await conn.startSession();

  let soldOut = false;
  try {
    await dbSession.withTransaction(async () => {
      for (const [roomTypeId, count] of countByRoomType) {
        await reserveRoomTypeNights(
          roomTypeId,
          nights,
          count,
          totalInventoryByRoomType.get(roomTypeId)!,
          dbSession
        );
      }
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

  try {
    await generateAndSendInvoice(booking);
  } catch (error) {
    console.error("Failed to generate/send invoice for booking", booking._id.toString(), error);
  }

  return NextResponse.json({ received: true });
}
