import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { completeGoogleSignupSchema } from "@/lib/validation/auth";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal";
import { consumePendingOAuthSignup } from "@/lib/oauth-signup-tokens";
import { User } from "@/models/User";
import { ConsentLog } from "@/models/ConsentLog";

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = completeGoogleSignupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const pending = await consumePendingOAuthSignup(parsed.data.token);
    if (!pending) {
      return NextResponse.json(
        { error: "This link has expired. Please try Continue with Google again." },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: pending.email });
    if (existing) {
      return NextResponse.json({ email: existing.email }, { status: 200 });
    }

    const ip = getClientIp(request);
    const timestamp = new Date();

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      role: "customer",
      emailVerified: timestamp,
      gdprConsent: { version: PRIVACY_POLICY_VERSION, timestamp, ip },
    });

    await ConsentLog.create({
      userId: user._id,
      consentType: "privacy_policy",
      granted: true,
      timestamp,
      ip,
    });

    return NextResponse.json({ email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Complete Google signup failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
