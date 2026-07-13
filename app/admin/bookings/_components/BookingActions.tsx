"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";

const ACTIONS: { action: "confirm" | "reject"; label: string; variant: "default" | "destructive" }[] = [
  { action: "confirm", label: "Confirm booking", variant: "default" },
  { action: "reject", label: "Reject request", variant: "destructive" },
];

export function BookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function handleAction(action: "confirm" | "reject") {
    setPending(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast({ title: typeof body?.error === "string" ? body.error : "Could not update the booking", variant: "destructive" });
        return;
      }
      toast({ title: action === "confirm" ? "Booking confirmed." : "Request rejected.", variant: "success" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((item) => (
        <ConfirmDialog
          key={item.action}
          trigger={
            <Button type="button" variant={item.variant} disabled={pending}>
              {item.label}
            </Button>
          }
          title={`${item.label}?`}
          description={
            item.action === "confirm"
              ? "This reserves inventory for these dates and marks the booking as confirmed & paid. Make sure offline payment has been received first."
              : "This cancels the request. The guest will need to submit a new request if they still want to book."
          }
          confirmLabel={item.label}
          variant={item.variant}
          onConfirm={() => handleAction(item.action)}
        />
      ))}
    </div>
  );
}
