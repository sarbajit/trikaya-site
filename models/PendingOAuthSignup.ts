import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IPendingOAuthSignup extends Document {
  tokenHash: string;
  name: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

const PendingOAuthSignupSchema = new Schema<IPendingOAuthSignup>({
  tokenHash: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const PendingOAuthSignup: Model<IPendingOAuthSignup> =
  models.PendingOAuthSignup || model<IPendingOAuthSignup>("PendingOAuthSignup", PendingOAuthSignupSchema);
