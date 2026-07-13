"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge, type AdminStatus } from "@/components/ui/status-badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export interface BookingRow {
  id: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export function BookingsTable({ rows }: { rows: BookingRow[] }) {
  const columns: DataTableColumn<BookingRow>[] = [
    {
      key: "property",
      header: "Property",
      sortValue: (row) => row.propertyName,
      render: (row) => <span className="font-medium text-foreground">{row.propertyName}</span>,
    },
    {
      key: "dates",
      header: "Dates",
      sortValue: (row) => row.checkIn,
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.checkIn} &rarr; {row.checkOut}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      sortValue: (row) => row.totalAmount,
      render: (row) => (
        <span className="whitespace-nowrap">
          {row.currency} {row.totalAmount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status as AdminStatus} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <Button asChild variant="outline" size="sm">
          <Link href={`/account/bookings/${row.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return <DataTable columns={columns} data={rows} rowKey={(row) => row.id} emptyMessage="No bookings yet." />;
}
