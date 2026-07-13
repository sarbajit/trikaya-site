import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { User } from "@/models/User";
import { ConsentLog } from "@/models/ConsentLog";

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { userId } = await params;

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  user.name = "Deleted user";
  user.email = `deleted-${user._id}@anonymized.trikaya`;
  user.phone = undefined;
  user.passwordHash = undefined;
  user.emailVerified = null;
  await user.save();

  const ip = getClientIp(request);
  await ConsentLog.create({
    userId: user._id,
    consentType: "data_deletion_fulfilled",
    granted: true,
    timestamp: new Date(),
    ip,
  });

  return NextResponse.json({ ok: true });
}
