import { Schema, model, models, type Document, type Model } from "mongoose";

export interface ISocialLink {
  platform: string;
  url: string;
}

export interface ITaxSettings {
  gstin?: string;
}

export interface ISiteSettings extends Document {
  key: "main";
  companyName: string;
  showCompanyName: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  addresses: string[];
  phones: string[];
  emails: string[];
  socialLinks: ISocialLink[];
  contactRecipientEmail: string;
  b2bEnabled: boolean;
  invoicePrefix: string;
  taxSettings?: ITaxSettings;
  childMaxAge: number;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: "main", enum: ["main"] },
    companyName: { type: String, required: true },
    showCompanyName: { type: Boolean, required: true, default: true },
    logoUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    accentColor: { type: String },
    addresses: { type: [String], default: [] },
    phones: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    socialLinks: {
      type: [new Schema<ISocialLink>({ platform: String, url: String }, { _id: false })],
      default: [],
    },
    contactRecipientEmail: { type: String, required: true },
    b2bEnabled: { type: Boolean, required: true, default: false },
    invoicePrefix: { type: String, required: true, default: "INV-" },
    taxSettings: {
      type: new Schema<ITaxSettings>({ gstin: String }, { _id: false }),
      required: false,
    },
    childMaxAge: { type: Number, required: true, default: 12, min: 0 },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  models.SiteSettings || model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export async function getSiteSettings(): Promise<ISiteSettings> {
  const existing = await SiteSettings.findOne({ key: "main" });
  if (existing) return existing;
  return SiteSettings.create({
    key: "main",
    companyName: "",
    showCompanyName: true,
    contactRecipientEmail: "",
    b2bEnabled: false,
    invoicePrefix: "INV-",
  });
}
