import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IRatePlan extends Document {
  _id: Types.ObjectId;
  roomTypeId: Types.ObjectId;
  label?: string;
  startDate: Date;
  endDate: Date;
  b2cRate: number;
  b2bRate: number;
  daysOfWeek?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const RatePlanSchema = new Schema<IRatePlan>(
  {
    roomTypeId: { type: Schema.Types.ObjectId, ref: "RoomType", required: true },
    label: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    b2cRate: { type: Number, required: true, min: 0 },
    b2bRate: { type: Number, required: true, min: 0 },
    daysOfWeek: { type: [Number], min: 0, max: 6 },
  },
  { timestamps: true }
);

RatePlanSchema.index({ roomTypeId: 1, startDate: 1, endDate: 1 });
RatePlanSchema.index({ roomTypeId: 1, label: 1 }, { unique: true, sparse: true });

export const RatePlan: Model<IRatePlan> =
  models.RatePlan || model<IRatePlan>("RatePlan", RatePlanSchema);
