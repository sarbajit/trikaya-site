"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingDetails {
  bookingId: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  currency: string;
  propertyName: string | null;
  propertySlug: string | null;
  roomTypeName: string | null;
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30;

export function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          setError(typeof data.error === "string" ? data.error : "Could not load this booking.");
          return;
        }

        setBooking(data);

        if (data.status === "confirmed" || data.status === "cancelled") {
          return;
        }

        pollCount.current += 1;
        if (pollCount.current >= MAX_POLLS) {
          setTimedOut(true);
          return;
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setError("Could not load this booking.");
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bookingId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!booking) {
    return <p className="text-center text-sm text-muted-foreground">Loading your booking…</p>;
  }

  const isConfirmed = booking.status === "confirmed";
  const isCancelled = booking.status === "cancelled";
  const isPending = !isConfirmed && !isCancelled;

  return (
    <Card>
      <CardHeader className="items-center text-center">
        {isConfirmed && <CheckCircle2 className="size-10 text-emerald-600" />}
        {isCancelled && <XCircle className="size-10 text-destructive" />}
        {isPending && !timedOut && <Clock className="size-10 animate-pulse text-primary" />}
        <CardTitle className="font-display text-2xl">
          {isConfirmed && "Booking confirmed"}
          {isCancelled && "Booking not confirmed"}
          {isPending && !timedOut && "Confirming your payment…"}
          {isPending && timedOut && "Still processing"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && !timedOut && (
          <p className="text-center text-sm text-muted-foreground">
            Your payment was received and we&apos;re confirming your booking. This usually takes a few seconds.
          </p>
        )}
        {isPending && timedOut && (
          <p className="text-center text-sm text-muted-foreground">
            This is taking longer than expected. If your payment was successful, your booking will confirm shortly —
            otherwise please contact us with your booking reference below.
          </p>
        )}
        {isCancelled && (
          <p className="text-center text-sm text-muted-foreground">
            This booking could not be confirmed. If you were charged, please contact us with the reference below.
          </p>
        )}

        <dl className="mt-5 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Booking reference</dt>
            <dd className="font-medium text-foreground">{booking.bookingId}</dd>
          </div>
          {booking.propertyName && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Property</dt>
              <dd className="font-medium text-foreground">{booking.propertyName}</dd>
            </div>
          )}
          {booking.roomTypeName && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Room</dt>
              <dd className="font-medium text-foreground">{booking.roomTypeName}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Dates</dt>
            <dd className="font-medium text-foreground">
              {booking.checkIn} &rarr; {booking.checkOut}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Guests</dt>
            <dd className="font-medium text-foreground">{booking.guests}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base">
            <dt className="font-medium text-foreground">Total paid</dt>
            <dd className="font-semibold text-foreground">₹{booking.totalAmount.toLocaleString("en-IN")}</dd>
          </div>
        </dl>

        {booking.propertySlug && (
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link href={`/properties/${booking.propertySlug}`}>Back to property</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
