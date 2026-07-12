import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import type { PricingModel } from "./RoomType";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingSource = "website" | "ota";

export interface IRazorpayDetails {
  orderId?: string;
  paymentId?: string;
  signature?: string;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  agentId?: Types.ObjectId;
  propertyId: Types.ObjectId;
  roomTypeId: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  pricingModelUsed: PricingModel;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  razorpay?: IRazorpayDetails;
  invoiceNumber?: string;
  status: BookingStatus;
  source: BookingSource;
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

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    pricingModelUsed: { type: String, enum: ["per_night", "per_person_per_night"], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      required: true,
      default: "pending",
    },
    razorpay: { type: RazorpaySchema },
    invoiceNumber: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      required: true,
      default: "pending",
      index: true,
    },
    source: { type: String, enum: ["website", "ota"], required: true, default: "website" },
  },
  { timestamps: true }
);

BookingSchema.index({ invoiceNumber: 1 }, { unique: true, sparse: true });

export const Booking: Model<IBooking> = models.Booking || model<IBooking>("Booking", BookingSchema);
