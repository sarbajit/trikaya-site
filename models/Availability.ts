import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IAvailability extends Document {
  _id: Types.ObjectId;
  roomTypeId: Types.ObjectId;
  date: Date;
  totalUnits: number;
  booked: number;
  blocked: number;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    date: { type: Date, required: true },
    totalUnits: { type: Number, required: true, min: 0 },
    booked: { type: Number, required: true, default: 0, min: 0 },
    blocked: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

AvailabilitySchema.index({ roomTypeId: 1, date: 1 }, { unique: true });

export const Availability: Model<IAvailability> =
  models.Availability || model<IAvailability>("Availability", AvailabilitySchema);
