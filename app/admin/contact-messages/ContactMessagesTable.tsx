"use client";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export function ContactMessagesTable({ rows }: { rows: ContactMessageRow[] }) {
  const columns: DataTableColumn<ContactMessageRow>[] = [
    {
      key: "name",
      header: "From",
      sortValue: (row) => row.name,
      render: (row) => (
        <>
          <div className="font-medium text-foreground">{row.name}</div>
          <div className="text-xs text-muted-foreground">{row.email}</div>
        </>
      ),
    },
    {
      key: "message",
      header: "Message",
      className: "max-w-md",
      render: (row) => <p className="line-clamp-3 text-sm text-foreground">{row.message}</p>,
    },
    {
      key: "createdAt",
      header: "Received",
      sortValue: (row) => new Date(row.createdAt).getTime(),
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  return <DataTable columns={columns} data={rows} rowKey={(row) => row.id} emptyMessage="No messages yet." />;
}
