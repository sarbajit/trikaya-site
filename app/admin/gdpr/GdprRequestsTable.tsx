"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";

export interface GdprRequestRow {
  id: string;
  userId?: string;
  name: string;
  email: string;
  type: "data_export_request" | "data_deletion_request";
  timestamp: string;
  fulfilled: boolean;
}

export function GdprRequestsTable({ initialRows }: { initialRows: GdprRequestRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function anonymize(row: GdprRequestRow) {
    if (!row.userId) return;
    setPendingId(row.id);
    try {
      const response = await fetch(`/api/admin/gdpr/anonymize/${row.userId}`, { method: "POST" });
      if (!response.ok) {
        toast({ title: "Failed to anonymize user", variant: "destructive" });
        return;
      }
      setRows((prev) => prev.map((r) => (r.userId === row.userId ? { ...r, fulfilled: true } : r)));
      toast({ title: "User anonymized.", variant: "success" });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  const columns: DataTableColumn<GdprRequestRow>[] = [
    {
      key: "user",
      header: "User",
      sortValue: (row) => row.name,
      render: (row) => (
        <>
          <div className="font-medium text-foreground">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </>
      ),
    },
    {
      key: "type",
      header: "Request",
      sortValue: (row) => row.type,
      render: (row) => (row.type === "data_export_request" ? "Data export" : "Account deletion"),
    },
    {
      key: "timestamp",
      header: "Requested",
      sortValue: (row) => new Date(row.timestamp).getTime(),
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (row) => new Date(row.timestamp).toLocaleString(),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        if (row.type === "data_export_request") return <StatusBadge status="completed" />;
        return <StatusBadge status={row.fulfilled ? "completed" : "pending"} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) =>
        row.type === "data_deletion_request" && !row.fulfilled ? (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive" size="sm" disabled={pendingId === row.id}>
                Anonymize
              </Button>
            }
            title="Anonymize this user?"
            description="Scrubs name/email/phone/password from their profile. Bookings, reviews, and invoices are kept intact for legal/tax retention. This can't be undone."
            confirmLabel="Anonymize"
            onConfirm={() => anonymize(row)}
          />
        ) : null,
    },
  ];

  return <DataTable columns={columns} data={rows} rowKey={(row) => row.id} emptyMessage="No data requests yet." />;
}
