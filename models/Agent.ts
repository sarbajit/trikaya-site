import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import type { IGdprConsent } from "./User";

export type AgentStatus = "pending" | "approved" | "rejected" | "suspended";

export interface IAgent extends Document {
  _id: Types.ObjectId;
  businessName: string;
  gstin?: string;
  contactPerson: string;
  email: string;
  phone: string;
  passwordHash: string;
  proofDocUrls: string[];
  status: AgentStatus;
  rateTier?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
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

const AgentSchema = new Schema<IAgent>(
  {
    businessName: { type: String, required: true, trim: true },
    gstin: { type: String, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    proofDocUrls: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      required: true,
      default: "pending",
      index: true,
    },
    rateTier: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    gdprConsent: { type: GdprConsentSchema },
  },
  { timestamps: true }
);

export const Agent: Model<IAgent> = models.Agent || model<IAgent>("Agent", AgentSchema);
