"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [ratePlans, setRatePlans] = useState(initialRatePlans);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/rate-plans/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "Failed to delete rate plan");
        return;
      }
      setRatePlans((prev) => prev.filter((rp) => rp.id !== id));
      router.refresh();
    } finally {
      setDeletingId(null);
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
            <TableHead>Label</TableHead>
            <TableHead>Date range</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>B2C</TableHead>
            <TableHead>B2B</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ratePlans.map((ratePlan) => (
            <TableRow key={ratePlan.id}>
              <TableCell className="font-medium text-foreground">{ratePlan.label || "—"}</TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {ratePlan.startDate} &rarr; {ratePlan.endDate}
              </TableCell>
              <TableCell>
                {ratePlan.daysOfWeek && ratePlan.daysOfWeek.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {ratePlan.daysOfWeek.map((d) => (
                      <Badge key={d} variant="muted">
                        {DAY_LABELS[d]}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Every day</span>
                )}
              </TableCell>
              <TableCell>₹{ratePlan.b2cRate.toLocaleString("en-IN")}</TableCell>
              <TableCell>₹{ratePlan.b2bRate.toLocaleString("en-IN")}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/rate-plans/${ratePlan.id}/edit`}>Edit</Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" disabled={deletingId === ratePlan.id}>
                        <Trash2 />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Delete this rate plan?</DialogTitle>
                      <p className="mt-2 text-sm text-muted-foreground">This cannot be undone.</p>
                      <div className="mt-4 flex justify-end gap-2">
                        <DialogClose asChild>
                          <Button type="button" variant="outline" size="sm">
                            Cancel
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(ratePlan.id)}
                          >
                            Delete
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {ratePlans.length === 0 && <p className="text-sm text-muted-foreground">No rate plan overrides yet — base rates apply.</p>}
    </div>
  );
}
