import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { User } from "@/models/User";

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const userId = await consumeAuthToken(parsed.data.token, "password-reset");
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await User.findByIdAndUpdate(userId, { passwordHash });

    return NextResponse.json({ reset: true });
  } catch (error) {
    console.error("Password reset failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
