import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

// "agent" exists for session-type completeness only — an agent identity actually
// lives in models/Agent.ts (a standalone collection, no FK to User). No code path
// sets role: "agent" on a User document.
export type UserRole = "customer" | "agent" | "admin";

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
  emailVerified?: Date | null;
  gdprConsent?: IGdprConsent;
  loginEnabled: boolean;
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
    role: { type: String, enum: ["customer", "agent", "admin"], required: true, default: "customer" },
    emailVerified: { type: Date, default: null },
    gdprConsent: { type: GdprConsentSchema },
    loginEnabled: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
