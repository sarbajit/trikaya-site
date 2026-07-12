import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { registerAgentSchema } from "@/lib/validation/agent";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal";
import { sendAgentRegisteredAdminEmail } from "@/lib/email";
import { Agent } from "@/models/Agent";
import { User } from "@/models/User";
import { ConsentLog } from "@/models/ConsentLog";
import { getSiteSettings } from "@/models/SiteSettings";

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = registerAgentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessName, gstin, contactPerson, email, phone, password, proofDocUrls, consent } = parsed.data;
  void consent;
  const normalizedEmail = email.toLowerCase();

  try {
    const [existingUser, existingAgent] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Agent.findOne({ email: normalizedEmail }),
    ]);
    if (existingUser || existingAgent) {
      return NextResponse.json(
        { error: { formErrors: [], fieldErrors: { email: ["Email already registered"] } } },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const ip = getClientIp(request);
    const timestamp = new Date();

    const agent = await Agent.create({
      businessName,
      gstin: gstin || undefined,
      contactPerson,
      email: normalizedEmail,
      phone,
      passwordHash,
      proofDocUrls,
      status: "pending",
      gdprConsent: { version: PRIVACY_POLICY_VERSION, timestamp, ip },
    });

    await ConsentLog.create({
      agentId: agent._id,
      consentType: "privacy_policy",
      granted: true,
      timestamp,
      ip,
    });

    try {
      const settings = await getSiteSettings();
      if (settings.contactRecipientEmail) {
        await sendAgentRegisteredAdminEmail({
          to: settings.contactRecipientEmail,
          businessName: agent.businessName,
          contactPerson: agent.contactPerson,
          email: agent.email,
          reviewUrl: `${process.env.NEXTAUTH_URL}/admin/agents`,
        });
      }
    } catch (error) {
      console.error("Failed to send agent registration admin notification", error);
    }

    return NextResponse.json({ id: agent._id, email: agent.email }, { status: 201 });
  } catch (error) {
    console.error("Agent registration failed", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
