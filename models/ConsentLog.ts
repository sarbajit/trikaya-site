import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IConsentLog extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  sessionId?: string;
  consentType: string;
  granted: boolean;
  timestamp: Date;
  ip: string;
}

const ConsentLogSchema = new Schema<IConsentLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  sessionId: { type: String, index: true },
  consentType: { type: String, required: true },
  granted: { type: Boolean, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  ip: { type: String, required: true },
});

export const ConsentLog: Model<IConsentLog> =
  models.ConsentLog || model<IConsentLog>("ConsentLog", ConsentLogSchema);
