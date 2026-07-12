import { connectDB } from "@/lib/db";
import { Agent } from "@/models/Agent";
import { AgentApprovalTable } from "./AgentApprovalTable";

export default async function AdminAgentsPage() {
  await connectDB();
  const agents = await Agent.find().sort({ createdAt: -1 });

  const initialAgents = agents.map((agent) => ({
    id: agent._id.toString(),
    businessName: agent.businessName,
    gstin: agent.gstin,
    contactPerson: agent.contactPerson,
    email: agent.email,
    phone: agent.phone,
    proofDocUrls: agent.proofDocUrls,
    status: agent.status,
    createdAt: agent.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">B2B Agent Approval Queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review business-proof documents and approve, reject, or suspend agent accounts.
      </p>
      <AgentApprovalTable initialAgents={initialAgents} />
    </main>
  );
}
