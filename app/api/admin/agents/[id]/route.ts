import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { adminUpdateAgentStatusSchema } from "@/lib/validation/agent";
import { sendAgentStatusChangedEmail } from "@/lib/email";
import { Agent } from "@/models/Agent";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = adminUpdateAgentStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const agent = await Agent.findByIdAndUpdate(
    id,
    {
      $set: {
        status: parsed.data.status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  try {
    await sendAgentStatusChangedEmail({
      to: agent.email,
      contactPerson: agent.contactPerson,
      status: parsed.data.status,
      loginUrl: `${process.env.NEXTAUTH_URL}/login`,
    });
  } catch (error) {
    console.error("Failed to send agent status-change email", error);
  }

  revalidatePath("/admin/agents");

  return NextResponse.json(agent);
}
