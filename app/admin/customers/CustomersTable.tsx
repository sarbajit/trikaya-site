"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  loginEnabled: boolean;
  createdAt: string;
}

export function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  const columns: DataTableColumn<CustomerRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (row) => row.name,
      render: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortValue: (row) => row.email,
      render: (row) => row.email,
    },
    {
      key: "phone",
      header: "Phone",
      className: "text-sm text-muted-foreground",
      render: (row) => row.phone || "—",
    },
    {
      key: "login",
      header: "Login",
      render: (row) => (
        <Badge variant={row.loginEnabled ? "success" : "muted"}>{row.loginEnabled ? "Enabled" : "Disabled"}</Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortValue: (row) => new Date(row.createdAt).getTime(),
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/customers/${row.id}/edit`}>Edit</Link>
        </Button>
      ),
    },
  ];

  return <DataTable columns={columns} data={rows} rowKey={(row) => row.id} emptyMessage="No customers yet." />;
}
