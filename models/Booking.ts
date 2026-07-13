import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import type { PricingModel } from "./RoomType";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "awaiting_offline";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "requested";
export type BookingSource = "website" | "ota" | "manual";

export interface IRazorpayDetails {
  orderId?: string;
  paymentId?: string;
  signature?: string;
}

export interface IBookingRoomNightRate {
  date: string;
  /** per_night: the flat per-room rate for this night. per_person_per_night: the per-adult rate. */
  adultRate: number;
  /** Resolved per-child rate for this night; ignored (not applied) for per_night rooms. */
  childRate: number;
  /**
   * Precomputed total charge for this room, this night (adults*adultRate +
   * banded children, or the flat adultRate for per_night rooms) — snapshotted
   * at booking-creation time so nothing downstream (Swipe invoice lines,
   * account page) needs to re-derive age-banding logic or re-read the
   * (possibly since-changed) SiteSettings.childMaxAge.
   */
  amount: number;
}

export interface IBookingRoom {
  roomTypeId: Types.ObjectId;
  /** Snapshot at booking time so downstream code never needs to re-fetch RoomType to know how to read amounts. */
  pricingModel: PricingModel;
  adults: number;
  childAges: number[];
  nightlyRates: IBookingRoomNightRate[];
  roomTotal: number;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  agentId?: Types.ObjectId;
  propertyId: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  rooms: IBookingRoom[];
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  razorpay?: IRazorpayDetails;
  invoiceNumber?: string;
  swipeInvoiceId?: string;
  status: BookingStatus;
  source: BookingSource;
  createdBy?: Types.ObjectId;
  guestNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RazorpaySchema = new Schema<IRazorpayDetails>(
  {
    orderId: String,
    paymentId: String,
    signature: String,
  },
  { _id: false }
);

const BookingRoomNightRateSchema = new Schema<IBookingRoomNightRate>(
  {
    date: { type: String, required: true },
    adultRate: { type: Number, required: true, min: 0 },
    childRate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BookingRoomSchema = new Schema<IBookingRoom>(
  {
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    pricingModel: { type: String, enum: ["per_night", "per_person_per_night"], required: true },
    adults: { type: Number, required: true, min: 1 },
    childAges: { type: [Number], default: [] },
    nightlyRates: { type: [BookingRoomNightRateSchema], default: [] },
    roomTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    rooms: {
      type: [BookingRoomSchema],
      required: true,
      validate: {
        validator: (rooms: IBookingRoom[]) => rooms.length > 0,
        message: "A booking must have at least one room",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "awaiting_offline"],
      required: true,
      default: "pending",
    },
    razorpay: { type: RazorpaySchema },
    invoiceNumber: { type: String },
    swipeInvoiceId: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "requested"],
      required: true,
      default: "pending",
      index: true,
    },
    source: { type: String, enum: ["website", "ota", "manual"], required: true, default: "website" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    guestNote: { type: String, trim: true },
  },
  { timestamps: true }
);

BookingSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });

export const Booking: Model<IBooking> = models.Booking || model<IBooking>("Booking", BookingSchema);
