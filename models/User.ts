import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type UserRole = "customer" | "admin";

export interface IGdprConsent {
  version: string;
  timestamp: Date;
  ip: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  gdprConsent?: IGdprConsent;
  createdAt: Date;
  updatedAt: Date;
}

const GdprConsentSchema = new Schema<IGdprConsent>(
  {
    version: { type: String, required: true },
    timestamp: { type: Date, required: true },
    ip: { type: String, required: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["customer", "admin"], required: true, default: "customer" },
    gdprConsent: { type: GdprConsentSchema },
  },
  { timestamps: true }
);

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
