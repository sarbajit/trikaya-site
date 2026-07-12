import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { User } from "@/models/User";
import { z } from "zod";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const userId = await consumeAuthToken(parsed.data.token, "email-verification");
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    await User.findByIdAndUpdate(userId, { emailVerified: new Date() });
    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Email verification failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
