"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface DayBookingSummaryClient {
  id: string;
  guestName: string;
  rooms: { roomTypeName: string; adults: number; childAges: number[] }[];
}

export function DayDetailModal({
  open,
  onOpenChange,
  iso,
  status,
  bookings,
  newBookingHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  iso: string | null;
  status: "available" | "partial" | "full" | undefined;
  bookings: DayBookingSummaryClient[];
  newBookingHref: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{iso}</DialogTitle>

        <div className="mt-3 flex flex-col gap-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings on this date.</p>
          ) : (
            bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="rounded-md border border-border p-3 text-sm hover:bg-muted"
              >
                <p className="font-medium text-foreground">{booking.guestName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {booking.rooms
                    .map((r) => `${r.roomTypeName} (${r.adults} adult${r.adults > 1 ? "s" : ""})`)
                    .join(", ")}
                </p>
              </Link>
            ))
          )}

          {status !== "full" && (
            <Button asChild className="mt-1 w-full">
              <Link href={newBookingHref}>Create manual booking for this date</Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
