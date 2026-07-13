import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { User } from "@/models/User";
import { Booking } from "@/models/Booking";
import { Review } from "@/models/Review";
import { ConsentLog } from "@/models/ConsentLog";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role === "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = session.user.id;

  const [user, bookings, reviews, consentLogs] = await Promise.all([
    User.findById(userId).select("-passwordHash").lean(),
    Booking.find({ userId }).lean(),
    Review.find({ userId }).lean(),
    ConsentLog.find({ userId }).lean(),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ip = getClientIp(request);
  const timestamp = new Date();
  await ConsentLog.create({ userId, consentType: "data_export_request", granted: true, timestamp, ip });

  const exportData = {
    exportedAt: timestamp.toISOString(),
    profile: user,
    bookings,
    reviews,
    consentLogs,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=\"trikaya-data-export.json\"",
    },
  });
}
