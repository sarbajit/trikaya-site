import { connectDB } from "@/lib/db";
import { Agent } from "@/models/Agent";
import { AgentApprovalTable } from "./AgentApprovalTable";
import { PageHeader } from "../_components/PageHeader";

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
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="B2B Agent Approval Queue"
        description="Review business-proof documents and approve, reject, or suspend agent accounts."
      />
      <AgentApprovalTable initialAgents={initialAgents} />
    </div>
  );
}
