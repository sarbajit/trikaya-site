import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { contactSchema } from "@/lib/validation/contact";
import { ContactMessage } from "@/models/ContactMessage";
import { getSiteSettings } from "@/models/SiteSettings";
import { sendContactMessageEmail } from "@/lib/email";

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, message } = parsed.data;

  const contactMessage = await ContactMessage.create({ name, email, message });

  try {
    const settings = await getSiteSettings();
    if (settings.contactRecipientEmail) {
      await sendContactMessageEmail({
        to: settings.contactRecipientEmail,
        name,
        email,
        message,
        adminUrl: `${process.env.NEXTAUTH_URL}/admin/contact-messages`,
      });
    }
  } catch (error) {
    console.error("Failed to send contact notification email", error);
  }

  return NextResponse.json({ id: contactMessage._id }, { status: 201 });
}
