import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type PropertyType = "hotel" | "resort" | "homestay";
export type HomepageMode = "auto" | "single" | "portfolio" | "portal";

export interface IImage {
  url: string;
  alt: string;
}

export interface IPropertyPolicies {
  checkIn?: string;
  checkOut?: string;
  houseRules?: string;
}

export interface IProperty extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  destination: string;
  address: string;
  geo?: { lat: number; lng: number };
  description: string;
  propertyType: PropertyType;
  amenities: string[];
  images: IImage[];
  starRating?: number;
  googlePlaceId?: string;
  googleRating?: number;
  googleRatingCount?: number;
  googleRatingUpdatedAt?: Date;
  policies?: IPropertyPolicies;
  isActive: boolean;
  homepageMode: HomepageMode;
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

const PropertySchema = new Schema<IProperty>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    destination: { type: String, required: true, index: true, trim: true },
    address: { type: String, required: true },
    geo: {
      type: new Schema({ lat: Number, lng: Number }, { _id: false }),
      required: false,
    },
    description: { type: String, required: true },
    propertyType: { type: String, enum: ["hotel", "resort", "homestay"], required: true },
    amenities: { type: [String], default: [] },
    images: { type: [ImageSchema], default: [] },
    starRating: { type: Number, min: 1, max: 5 },
    googlePlaceId: { type: String, trim: true },
    googleRating: { type: Number, min: 0, max: 5 },
    googleRatingCount: { type: Number, min: 0 },
    googleRatingUpdatedAt: { type: Date },
    policies: {
      type: new Schema<IPropertyPolicies>(
        {
          checkIn: String,
          checkOut: String,
          houseRules: String,
        },
        { _id: false }
      ),
      required: false,
    },
    isActive: { type: Boolean, required: true, default: true, index: true },
    homepageMode: {
      type: String,
      enum: ["auto", "single", "portfolio", "portal"],
      required: true,
      default: "auto",
    },
  },
  { timestamps: true }
);

export const Property: Model<IProperty> =
  models.Property || model<IProperty>("Property", PropertySchema);
