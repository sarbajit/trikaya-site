import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getClientIp } from "@/lib/http";
import { ConsentLog } from "@/models/ConsentLog";

const consentSchema = z.object({
  sessionId: z.string().trim().min(1).optional(),
  categories: z.object({
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

export async function POST(request: Request) {
  await connectDB();

  const json = await request.json().catch(() => null);
  const parsed = consentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await auth();
  const isAgent = session?.user?.role === "agent";
  const userId = session?.user && !isAgent ? session.user.id : undefined;
  const agentId = isAgent ? session?.user?.id : undefined;
  const { sessionId, categories } = parsed.data;
  const ip = getClientIp(request);
  const timestamp = new Date();

  const entries = [
    { consentType: "cookie_necessary", granted: true },
    { consentType: "cookie_analytics", granted: categories.analytics },
    { consentType: "cookie_marketing", granted: categories.marketing },
  ];

  await ConsentLog.insertMany(
    entries.map((entry) => ({
      ...entry,
      userId,
      agentId,
      sessionId: userId || agentId ? undefined : sessionId,
      timestamp,
      ip,
    }))
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
