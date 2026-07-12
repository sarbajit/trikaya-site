"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarClock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SELECT_ROOM_EVENT, type RoomTypeCardData } from "@/app/(public)/_components/RoomTypeCard";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string | null; email?: string | null };
  theme?: { color?: string };
  handler: () => void;
  modal?: { ondismiss?: () => void };
}

interface NightlyBreakdown {
  date: string;
  rate: number;
}

interface RoomTypeQuote {
  nights: number;
  currency: string;
  nightlyBreakdown: NightlyBreakdown[];
  subtotal: number;
  totalAmount: number;
  isAvailable: boolean;
  guestsExceedOccupancy: boolean;
  unavailableDates: string[];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the payment gateway. Check your connection and retry."));
    document.body.appendChild(script);
  });
}

export function BookingWidget({ rooms }: { rooms: RoomTypeCardData[] }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get("room");

  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    (roomFromUrl && rooms.some((r) => r.id === roomFromUrl) ? roomFromUrl : rooms[0]?.id) ?? ""
  );
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState<RoomTypeQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId), [rooms, selectedRoomId]);

  function resetQuote() {
    setQuote(null);
    setQuoteError(null);
    setBookingError(null);
  }

  useEffect(() => {
    function handleSelectRoom(event: Event) {
      const roomId = (event as CustomEvent<string>).detail;
      if (rooms.some((r) => r.id === roomId)) {
        setSelectedRoomId(roomId);
        resetQuote();
      }
    }
    window.addEventListener(SELECT_ROOM_EVENT, handleSelectRoom);
    return () => window.removeEventListener(SELECT_ROOM_EVENT, handleSelectRoom);
  }, [rooms]);

  useEffect(() => {
    if (roomFromUrl) {
      document.getElementById("booking-widget")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Only run once on mount for the URL that brought the user here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheckAvailability() {
    if (!selectedRoom || !checkIn || !checkOut) {
      setQuoteError("Select a room and both dates.");
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);
    try {
      const response = await fetch(`/api/room-types/${selectedRoom.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, guests }),
      });
      const data = await response.json();
      if (!response.ok) {
        setQuoteError(typeof data.error === "string" ? data.error : "Could not fetch a quote for those dates.");
        return;
      }
      setQuote(data);
    } catch {
      setQuoteError("Something went wrong checking availability. Please try again.");
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleBookAndPay() {
    if (!selectedRoom || !quote || !quote.isAvailable) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomTypeId: selectedRoom.id, checkIn, checkOut, guests }),
      });
      const bookingData = await bookingResponse.json();
      if (!bookingResponse.ok) {
        setBookingError(typeof bookingData.error === "string" ? bookingData.error : "Could not create the booking.");
        return;
      }

      const orderResponse = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingData.bookingId }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        setBookingError(typeof orderData.error === "string" ? orderData.error : "Could not start the payment.");
        return;
      }

      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: "Trikaya",
        description: selectedRoom.name,
        prefill: { name: session?.user?.name, email: session?.user?.email },
        handler: () => {
          router.push(`/booking/${bookingData.bookingId}/confirmation`);
        },
        modal: {
          ondismiss: () => {
            setBookingLoading(false);
            setBookingError("Payment was cancelled. You can try again.");
          },
        },
      });
      rzp.open();
    } catch {
      setBookingError("Something went wrong starting the payment. Please try again.");
      setBookingLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <aside id="booking-widget" className="h-fit scroll-mt-24 rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </aside>
    );
  }

  if (status === "unauthenticated") {
    return (
      <aside id="booking-widget" className="h-fit scroll-mt-24 rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
        <p className="flex items-center gap-2 font-display text-lg text-foreground">
          <CalendarClock className="size-4 text-primary" /> Check availability
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Log in to check availability and book instantly.</p>
        <Button asChild className="mt-4 w-full">
          <Link href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}>
            Log in to book
          </Link>
        </Button>
      </aside>
    );
  }

  if (session?.user?.role !== "customer" && session?.user?.role !== "agent") {
    return (
      <aside id="booking-widget" className="h-fit scroll-mt-24 rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
        <p className="flex items-center gap-2 font-display text-lg text-foreground">
          <CalendarClock className="size-4 text-primary" /> Check availability
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Bookings are available for customer and agent accounts.</p>
      </aside>
    );
  }

  return (
    <aside id="booking-widget" className="h-fit scroll-mt-24 rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
      <p className="flex items-center gap-2 font-display text-lg text-foreground">
        <CalendarClock className="size-4 text-primary" /> Check availability
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <Label htmlFor="room">Room</Label>
          <Select
            value={selectedRoomId}
            onValueChange={(value) => {
              setSelectedRoomId(value);
              const room = rooms.find((r) => r.id === value);
              if (room && guests > room.maxOccupancy) setGuests(room.maxOccupancy);
              resetQuote();
            }}
          >
            <SelectTrigger id="room" className="mt-1">
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="checkIn">Check-in</Label>
            <Input
              id="checkIn"
              type="date"
              min={todayISO()}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                resetQuote();
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="checkOut">Check-out</Label>
            <Input
              id="checkOut"
              type="date"
              min={checkIn || todayISO()}
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                resetQuote();
              }}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="guests">Guests</Label>
          <Select
            value={String(guests)}
            onValueChange={(value) => {
              setGuests(Number(value));
              resetQuote();
            }}
          >
            <SelectTrigger id="guests" className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: selectedRoom?.maxOccupancy ?? 1 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} guest{n > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {quoteError && (
          <Alert variant="destructive">
            <AlertDescription>{quoteError}</AlertDescription>
          </Alert>
        )}

        {!quote && (
          <Button onClick={handleCheckAvailability} disabled={quoteLoading} className="w-full">
            {quoteLoading ? "Checking…" : "Check availability"}
          </Button>
        )}

        {quote && !quote.isAvailable && (
          <Alert variant="destructive">
            <AlertDescription>
              {quote.guestsExceedOccupancy
                ? "Guests exceed this room's occupancy."
                : "Not available for all selected dates. Try different dates."}
            </AlertDescription>
          </Alert>
        )}

        {quote && quote.isAvailable && (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-3">
            <div className="flex flex-col gap-1 text-sm text-foreground/80">
              {quote.nightlyBreakdown.map((n) => (
                <div key={n.date} className="flex justify-between">
                  <span>{n.date}</span>
                  <span>₹{n.rate.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Total ({quote.nights} night{quote.nights > 1 ? "s" : ""})</span>
              <span>₹{quote.totalAmount.toLocaleString("en-IN")}</span>
            </div>

            {bookingError && (
              <Alert variant="destructive">
                <AlertDescription>{bookingError}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleBookAndPay} disabled={bookingLoading} className="w-full">
              {bookingLoading ? "Processing…" : "Book & Pay"}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetQuote} disabled={bookingLoading}>
              Change dates
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
