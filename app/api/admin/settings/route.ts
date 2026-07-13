import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { SiteSettings, getSiteSettings } from "@/models/SiteSettings";
import { siteSettingsUpdateSchema } from "@/lib/validation/siteSettings";

export async function GET() {
  await connectDB();
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = siteSettingsUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await SiteSettings.findOneAndUpdate(
    { key: "main" },
    { $set: parsed.data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/properties/[slug]", "page");

  return NextResponse.json(updated);
}
