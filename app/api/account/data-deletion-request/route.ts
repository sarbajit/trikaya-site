import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { User } from "@/models/User";
import { ConsentLog } from "@/models/ConsentLog";
import { getSiteSettings } from "@/models/SiteSettings";
import { sendDataDeletionRequestedEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user.id;
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ip = getClientIp(request);
  const timestamp = new Date();
  await ConsentLog.create({ userId, consentType: "data_deletion_request", granted: true, timestamp, ip });

  try {
    const settings = await getSiteSettings();
    if (settings.contactRecipientEmail) {
      await sendDataDeletionRequestedEmail({
        to: settings.contactRecipientEmail,
        name: user.name,
        email: user.email,
        adminUrl: `${process.env.NEXTAUTH_URL}/admin/gdpr`,
      });
    }
  } catch (error) {
    console.error("Failed to send data deletion request email", error);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
