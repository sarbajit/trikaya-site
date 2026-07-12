import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IStaticPage extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaticPageSchema = new Schema<IStaticPage>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    content: { type: String, required: true, default: "" },
  },
  { timestamps: true }
);

export const StaticPage: Model<IStaticPage> =
  models.StaticPage || model<IStaticPage>("StaticPage", StaticPageSchema);
