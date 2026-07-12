import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import type { IImage } from "./Property";

export type PricingModel = "per_night" | "per_person_per_night";

export interface IRoomType extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  name: string;
  maxOccupancy: number;
  pricingModel: PricingModel;
  basePriceB2C: number;
  basePriceB2B: number;
  images: IImage[];
  totalInventory: number;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
  },
  { _id: false }
);

const RoomTypeSchema = new Schema<IRoomType>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    name: { type: String, required: true, trim: true },
    maxOccupancy: { type: Number, required: true, min: 1 },
    pricingModel: { type: String, enum: ["per_night", "per_person_per_night"], required: true },
    basePriceB2C: { type: Number, required: true, min: 0 },
    basePriceB2B: { type: Number, required: true, min: 0 },
    images: { type: [ImageSchema], default: [] },
    totalInventory: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

RoomTypeSchema.index({ propertyId: 1, name: 1 }, { unique: true });

export const RoomType: Model<IRoomType> =
  models.RoomType || model<IRoomType>("RoomType", RoomTypeSchema);
