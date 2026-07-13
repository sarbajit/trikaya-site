"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RatePlanRow {
  id: string;
  label?: string;
  startDate: string;
  endDate: string;
  b2cRate: number;
  b2bRate: number;
  daysOfWeek?: number[];
}

export function RatePlansTable({ initialRatePlans }: { initialRatePlans: RatePlanRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [ratePlans, setRatePlans] = useState(initialRatePlans);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/rate-plans/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast({ title: body?.error ?? "Failed to delete rate plan", variant: "destructive" });
        return;
      }
      setRatePlans((prev) => prev.filter((rp) => rp.id !== id));
      toast({ title: "Rate plan deleted.", variant: "success" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const columns: DataTableColumn<RatePlanRow>[] = [
    {
      key: "label",
      header: "Label",
      sortValue: (rp) => rp.label ?? "",
      className: "font-medium text-foreground",
      render: (rp) => rp.label || "—",
    },
    {
      key: "dateRange",
      header: "Date range",
      sortValue: (rp) => rp.startDate,
      className: "whitespace-nowrap text-sm",
      render: (rp) => (
        <>
          {rp.startDate} &rarr; {rp.endDate}
        </>
      ),
    },
    {
      key: "days",
      header: "Days",
      render: (rp) =>
        rp.daysOfWeek && rp.daysOfWeek.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {rp.daysOfWeek.map((d) => (
              <Badge key={d} variant="muted">
                {DAY_LABELS[d]}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Every day</span>
        ),
    },
    {
      key: "b2c",
      header: "B2C",
      sortValue: (rp) => rp.b2cRate,
      render: (rp) => `₹${rp.b2cRate.toLocaleString("en-IN")}`,
    },
    {
      key: "b2b",
      header: "B2B",
      sortValue: (rp) => rp.b2bRate,
      render: (rp) => `₹${rp.b2bRate.toLocaleString("en-IN")}`,
    },
    {
      key: "actions",
      header: "Actions",
      render: (ratePlan) => (
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/rate-plans/${ratePlan.id}/edit`}>Edit</Link>
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm" disabled={deletingId === ratePlan.id}>
                <Trash2 />
              </Button>
            }
            title="Delete this rate plan?"
            description="This cannot be undone."
            confirmLabel="Delete"
            onConfirm={() => handleDelete(ratePlan.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <DataTable
        columns={columns}
        data={ratePlans}
        rowKey={(rp) => rp.id}
        emptyMessage="No rate plan overrides yet — base rates apply."
      />
    </div>
  );
}
