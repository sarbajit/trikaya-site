"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export interface AuditRow {
  id: string;
  who: string;
  consentType: string;
  granted: boolean;
  ip: string;
  timestamp: string;
}

export function ConsentLogTable({ rows }: { rows: AuditRow[] }) {
  const columns: DataTableColumn<AuditRow>[] = [
    {
      key: "who",
      header: "Who",
      sortValue: (row) => row.who,
      render: (row) => <span className="font-medium text-foreground">{row.who}</span>,
    },
    {
      key: "type",
      header: "Consent type",
      sortValue: (row) => row.consentType,
      render: (row) => row.consentType,
    },
    {
      key: "granted",
      header: "Granted",
      render: (row) => (row.granted ? "Yes" : "No"),
    },
    {
      key: "ip",
      header: "IP",
      className: "text-sm text-muted-foreground",
      render: (row) => row.ip,
    },
    {
      key: "timestamp",
      header: "When",
      sortValue: (row) => new Date(row.timestamp).getTime(),
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (row) => new Date(row.timestamp).toLocaleString(),
    },
  ];

  return <DataTable columns={columns} data={rows} rowKey={(row) => row.id} emptyMessage="No consent activity yet." />;
}
