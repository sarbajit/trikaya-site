"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, type AdminStatus } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";

type AgentStatus = "pending" | "approved" | "rejected" | "suspended";

interface AgentRow {
  id: string;
  businessName: string;
  gstin?: string;
  contactPerson: string;
  email: string;
  phone: string;
  proofDocUrls: string[];
  status: AgentStatus;
  createdAt: string;
}

const ACTIONS: { status: Exclude<AgentStatus, "pending">; label: string; variant: "default" | "destructive" }[] = [
  { status: "approved", label: "Approve", variant: "default" },
  { status: "rejected", label: "Reject", variant: "destructive" },
  { status: "suspended", label: "Suspend", variant: "destructive" },
];

export function AgentApprovalTable({ initialAgents }: { initialAgents: AgentRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState(initialAgents);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: Exclude<AgentStatus, "pending">) {
    setPendingId(id);

    try {
      const response = await fetch(`/api/admin/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast({
          title: body?.error?.formErrors?.[0] ?? "Failed to update agent status",
          variant: "destructive",
        });
        return;
      }

      const updated = await response.json();
      setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, status: updated.status } : agent)));
      toast({ title: `Agent ${status}.`, variant: "success" });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  const columns: DataTableColumn<AgentRow>[] = [
    {
      key: "business",
      header: "Business",
      sortValue: (agent) => agent.businessName,
      render: (agent) => (
        <>
          <div className="font-medium text-foreground">{agent.businessName}</div>
          {agent.gstin && <div className="text-xs text-muted-foreground">GSTIN: {agent.gstin}</div>}
        </>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (agent) => (
        <>
          <div>{agent.contactPerson}</div>
          <div className="text-xs text-muted-foreground">
            {agent.email} · {agent.phone}
          </div>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (agent) => agent.status,
      render: (agent) => <StatusBadge status={agent.status as AdminStatus} />,
    },
    {
      key: "registered",
      header: "Registered",
      sortValue: (agent) => new Date(agent.createdAt).getTime(),
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (agent) => new Date(agent.createdAt).toLocaleDateString(),
    },
    {
      key: "documents",
      header: "Documents",
      render: (agent) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <FileText />
              View ({agent.proofDocUrls.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{agent.businessName} — proof documents</DialogTitle>
            <div className="mt-3 flex flex-col gap-2">
              {agent.proofDocUrls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-foreground underline"
                >
                  <FileText className="size-4" />
                  Document {index + 1}
                </a>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (agent) => (
        <div className="flex flex-wrap gap-2">
          {ACTIONS.filter((action) => action.status !== agent.status).map((action) => (
            <ConfirmDialog
              key={action.status}
              trigger={
                <Button type="button" variant="outline" size="sm" disabled={pendingId === agent.id}>
                  {action.label}
                </Button>
              }
              title={`${action.label} ${agent.businessName}?`}
              description={`This changes the agent's status to "${action.status}". They will be notified based on your existing email configuration.`}
              confirmLabel={action.label}
              variant={action.variant}
              onConfirm={() => updateStatus(agent.id, action.status)}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <DataTable
        columns={columns}
        data={agents}
        rowKey={(agent) => agent.id}
        emptyMessage="No agent registrations yet."
      />
    </div>
  );
}
