import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { User } from "@/models/User";

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (user) {
      const rawToken = await createAuthToken(user._id, "password-reset");
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail({ to: user.email, name: user.name, url: resetUrl });
    }

    // Always return a generic success response — avoids leaking account existence.
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
