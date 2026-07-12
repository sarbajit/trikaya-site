import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { registerSchema } from "@/lib/validation/auth";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal";
import { createAuthToken } from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/email";
import { User } from "@/models/User";
import { ConsentLog } from "@/models/ConsentLog";

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, password, consent } = parsed.data;
  void consent;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: { formErrors: [], fieldErrors: { email: ["Email already registered"] } } },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const ip = getClientIp(request);
    const timestamp = new Date();

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: phone || undefined,
      passwordHash,
      role: "customer",
      emailVerified: null,
      gdprConsent: { version: PRIVACY_POLICY_VERSION, timestamp, ip },
    });

    await ConsentLog.create({
      userId: user._id,
      consentType: "privacy_policy",
      granted: true,
      timestamp,
      ip,
    });

    const rawToken = await createAuthToken(user._id, "email-verification");
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${rawToken}`;

    try {
      await sendVerificationEmail({ to: user.email, name: user.name, url: verifyUrl });
    } catch (error) {
      console.error("Failed to send verification email", error);
    }

    return NextResponse.json({ id: user._id, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
