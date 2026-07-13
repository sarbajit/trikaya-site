"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge, type AdminStatus } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StarRating } from "@/app/(public)/_components/StarRating";
import { useToast } from "@/hooks/use-toast";

type ReviewStatus = "pending" | "approved" | "rejected";

interface ReviewRow {
  id: string;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

const ACTIONS: { status: Exclude<ReviewStatus, "pending">; label: string; variant: "default" | "destructive" }[] = [
  { status: "approved", label: "Approve", variant: "default" },
  { status: "rejected", label: "Reject", variant: "destructive" },
];

export function ReviewModerationTable({ initialReviews }: { initialReviews: ReviewRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: Exclude<ReviewStatus, "pending">) {
    setPendingId(id);

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        toast({
          title: body?.error?.formErrors?.[0] ?? "Failed to update review status",
          variant: "destructive",
        });
        return;
      }

      const updated = await response.json();
      setReviews((prev) => prev.map((review) => (review.id === id ? { ...review, status: updated.status } : review)));
      toast({ title: `Review ${status}.`, variant: "success" });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  const columns: DataTableColumn<ReviewRow>[] = [
    {
      key: "property",
      header: "Property",
      sortValue: (review) => review.propertyName,
      render: (review) => <span className="font-medium text-foreground">{review.propertyName}</span>,
    },
    {
      key: "guest",
      header: "Guest",
      render: (review) => (
        <>
          <div>{review.guestName}</div>
          <div className="text-xs text-muted-foreground">{review.guestEmail}</div>
        </>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      sortValue: (review) => review.rating,
      render: (review) => <StarRating rating={review.rating} />,
    },
    {
      key: "comment",
      header: "Comment",
      className: "max-w-xs",
      render: (review) => <p className="line-clamp-3 text-sm text-foreground">{review.comment}</p>,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (review) => review.status,
      render: (review) => <StatusBadge status={review.status as AdminStatus} />,
    },
    {
      key: "submitted",
      header: "Submitted",
      sortValue: (review) => new Date(review.createdAt).getTime(),
      className: "whitespace-nowrap text-sm text-muted-foreground",
      render: (review) => new Date(review.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (review) => (
        <div className="flex flex-wrap gap-2">
          {ACTIONS.filter((action) => action.status !== review.status).map((action) => (
            <ConfirmDialog
              key={action.status}
              trigger={
                <Button type="button" variant="outline" size="sm" disabled={pendingId === review.id}>
                  {action.label}
                </Button>
              }
              title={`${action.label} this review?`}
              description={`This changes the review's status to "${action.status}". ${
                action.status === "approved" ? "It will become visible on the property page." : ""
              }`}
              confirmLabel={action.label}
              variant={action.variant}
              onConfirm={() => updateStatus(review.id, action.status)}
            />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <DataTable columns={columns} data={reviews} rowKey={(review) => review.id} emptyMessage="No reviews yet." />
    </div>
  );
}
