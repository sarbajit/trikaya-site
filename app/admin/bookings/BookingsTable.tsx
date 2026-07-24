"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, type AdminStatus } from "@/components/ui/status-badge";
import { BOOKING_SOURCES, BOOKING_SOURCE_LABELS, type BookingSource } from "@/lib/constants/bookingSource";

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
  const [sourceFilter, setSourceFilter] = useState<BookingSource | "all">("all");
  const filteredRows = sourceFilter === "all" ? rows : rows.filter((row) => row.source === sourceFilter);

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
      className: "text-sm text-muted-foreground",
      render: (row) => BOOKING_SOURCE_LABELS[row.source as BookingSource] ?? row.source,
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

  return (
    <div className="flex flex-col gap-3">
      <div className="w-48">
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as BookingSource | "all")}>
          <SelectTrigger>
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {BOOKING_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {BOOKING_SOURCE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} data={filteredRows} rowKey={(row) => row.id} emptyMessage="No bookings match this filter." />
    </div>
  );
}
