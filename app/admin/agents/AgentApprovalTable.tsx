"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const STATUS_VARIANT: Record<AgentStatus, BadgeProps["variant"]> = {
  pending: "muted",
  approved: "success",
  rejected: "destructive",
  suspended: "destructive",
};

const ACTIONS: { status: Exclude<AgentStatus, "pending">; label: string }[] = [
  { status: "approved", label: "Approve" },
  { status: "rejected", label: "Reject" },
  { status: "suspended", label: "Suspend" },
];

export function AgentApprovalTable({ initialAgents }: { initialAgents: AgentRow[] }) {
  const router = useRouter();
  const [agents, setAgents] = useState(initialAgents);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: Exclude<AgentStatus, "pending">) {
    setPendingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/agents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error?.formErrors?.[0] ?? "Failed to update agent status");
        return;
      }

      const updated = await response.json();
      setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, status: updated.status } : agent)));
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>
                <div className="font-medium text-foreground">{agent.businessName}</div>
                {agent.gstin && <div className="text-xs text-muted-foreground">GSTIN: {agent.gstin}</div>}
              </TableCell>
              <TableCell>
                <div>{agent.contactPerson}</div>
                <div className="text-xs text-muted-foreground">
                  {agent.email} · {agent.phone}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[agent.status]}>{agent.status}</Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {new Date(agent.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS.filter((action) => action.status !== agent.status).map((action) => (
                    <Button
                      key={action.status}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pendingId === agent.id}
                      onClick={() => updateStatus(agent.id, action.status)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {agents.length === 0 && <p className="text-sm text-muted-foreground">No agent registrations yet.</p>}
    </div>
  );
}
