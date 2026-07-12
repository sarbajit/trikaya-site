import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type OTASyncMode = "webhook" | "cron" | "manual";
export type OTAConnectionStatus = "connected" | "disconnected" | "error";

export interface IOTAConnection extends Document {
  _id: Types.ObjectId;
  propertyId?: Types.ObjectId;
  provider: string;
  /** Must be encrypted with ENCRYPTION_KEY via lib/encryption.ts before being stored — never plaintext. */
  encryptedCredentials: string;
  syncMode: OTASyncMode;
  lastSyncedAt?: Date;
  status: OTAConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OTAConnectionSchema = new Schema<IOTAConnection>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property" },
    provider: { type: String, required: true },
    encryptedCredentials: { type: String, required: true },
    syncMode: { type: String, enum: ["webhook", "cron", "manual"], required: true, default: "manual" },
    lastSyncedAt: { type: Date },
    status: {
      type: String,
      enum: ["connected", "disconnected", "error"],
      required: true,
      default: "disconnected",
    },
  },
  { timestamps: true }
);

OTAConnectionSchema.index({ propertyId: 1, provider: 1 }, { unique: true });

export const OTAConnection: Model<IOTAConnection> =
  models.OTAConnection || model<IOTAConnection>("OTAConnection", OTAConnectionSchema);
