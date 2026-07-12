import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resendVerificationSchema } from "@/lib/validation/auth";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { User } from "@/models/User";

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = resendVerificationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (user && !user.emailVerified) {
      const rawToken = await createAuthToken(user._id, "email-verification");
      const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${rawToken}`;
      await sendVerificationEmail({ to: user.email, name: user.name, url: verifyUrl });
    }

    // Always return a generic success response, whether or not the account
    // exists or is already verified — avoids leaking account existence.
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Resend verification failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
