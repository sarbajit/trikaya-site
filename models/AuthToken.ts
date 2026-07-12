import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type AuthTokenType = "email-verification" | "password-reset";

export interface IAuthToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  type: AuthTokenType;
  expiresAt: Date;
  createdAt: Date;
}

const AuthTokenSchema = new Schema<IAuthToken>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  tokenHash: { type: String, required: true, unique: true },
  type: { type: String, enum: ["email-verification", "password-reset"], required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  createdAt: { type: Date, default: Date.now },
});

AuthTokenSchema.index({ userId: 1, type: 1 });

export const AuthToken: Model<IAuthToken> =
  models.AuthToken || model<IAuthToken>("AuthToken", AuthTokenSchema);
