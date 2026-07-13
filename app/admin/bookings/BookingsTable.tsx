"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge, type AdminStatus } from "@/components/ui/status-badge";

export interface BookingRow {
  id: string;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  currency: string;
  status: string;
  source: string;
  createdAt: string;
}

export function BookingsTable({ rows }: { rows: BookingRow[] }) {
  const columns: DataTableColumn<BookingRow>[] = [
    {
      key: "guest",
      header: "Guest",
      sortValue: (row) => row.guestName,
      render: (row) => (
        <>
          <div className="font-medium text-foreground">{row.guestName}</div>
          <div className="text-xs text-muted-foreground">{row.guestEmail}</div>
        </>
      ),
    },
    {
      key: "property",
      header: "Property",
      sortValue: (row) => row.propertyName,
      render: (row) => row.propertyName,
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
      key: "source",
      header: "Source",
      className: "text-sm text-muted-foreground capitalize",
      render: (row) => row.source,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/bookings/${row.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return <DataTable columns={columns} data={rows} rowKey={(row) => row.id} emptyMessage="No bookings yet." />;
}
