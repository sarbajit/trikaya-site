"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookingCart } from "@/app/(public)/_components/BookingCartContext";
import { type RoomTypeCardData } from "@/app/(public)/_components/RoomTypeCard";

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

interface QuoteRoom {
  roomTypeId: string;
  roomTypeName: string;
  roomTotal: number;
  occupancyError: string | null;
}

interface BookingQuote {
  nights: number;
  currency: string;
  rooms: QuoteRoom[];
  totalAmount: number;
  isAvailable: boolean;
  unavailableDates: string[];
  hasOccupancyErrors: boolean;
}

const DEFAULT_CHILD_AGE = 8;

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

export function BookingWidget({ rooms: catalog }: { rooms: RoomTypeCardData[] }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get("room");
  const appliedUrlRoom = useRef(false);

  const cart = useBookingCart();
  const { checkIn, checkOut, setCheckIn, setCheckOut, rooms, addRoom, updateRoom, removeRoom } = cart;

  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  function resetQuote() {
    setQuote(null);
    setQuoteError(null);
    setBookingError(null);
  }

  useEffect(() => {
    if (appliedUrlRoom.current) return;
    if (!roomFromUrl) return;
    const room = catalog.find((r) => r.id === roomFromUrl);
    if (!room) return;
    appliedUrlRoom.current = true;
    addRoom({
      roomTypeId: room.id,
      roomTypeName: room.name,
      maxOccupancy: room.maxOccupancy,
      pricingModel: room.pricingModel,
    });
    document.getElementById("booking-widget")?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Only run once on mount for the URL that brought the user here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCheckAvailability() {
    if (rooms.length === 0 || !checkIn || !checkOut) {
      setQuoteError("Add at least one room and select both dates.");
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);
    try {
      const response = await fetch("/api/bookings/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          rooms: rooms.map((r) => ({ roomTypeId: r.roomTypeId, adults: r.adults, childAges: r.childAges })),
        }),
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
    if (!quote || !quote.isAvailable) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const bookingResponse = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          rooms: rooms.map((r) => ({ roomTypeId: r.roomTypeId, adults: r.adults, childAges: r.childAges })),
        }),
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
          <CalendarClock className="size-4 text-primary" /> Your booking
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
          <CalendarClock className="size-4 text-primary" /> Your booking
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Bookings are available for customer and agent accounts.</p>
      </aside>
    );
  }

  const quoteByRoomTypeId = new Map((quote?.rooms ?? []).map((r) => [r.roomTypeId, r]));

  return (
    <aside id="booking-widget" className="h-fit scroll-mt-24 rounded-md border border-border bg-card p-5 lg:sticky lg:top-24">
      <p className="flex items-center gap-2 font-display text-lg text-foreground">
        <CalendarClock className="size-4 text-primary" /> Your booking
      </p>

      <div className="mt-4 flex flex-col gap-3">
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

        {rooms.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Add a room from the list below to start building your booking.
          </p>
        )}

        {rooms.map((room) => {
          const maxChildren = Math.max(0, room.maxOccupancy - room.adults);
          const roomQuote = quoteByRoomTypeId.get(room.roomTypeId);
          return (
            <div key={room.key} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{room.roomTypeName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    removeRoom(room.key);
                    resetQuote();
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="mt-2 flex gap-3">
                <div>
                  <Label htmlFor={`adults-${room.key}`}>Adults</Label>
                  <Input
                    id={`adults-${room.key}`}
                    type="number"
                    min={1}
                    max={room.maxOccupancy - room.childAges.length}
                    value={room.adults}
                    onChange={(e) => {
                      updateRoom(room.key, { adults: Number(e.target.value) });
                      resetQuote();
                    }}
                    className="mt-1 w-20"
                  />
                </div>
                <div>
                  <Label>Children</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-foreground">{room.childAges.length}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={room.childAges.length >= maxChildren}
                      onClick={() => {
                        updateRoom(room.key, { childAges: [...room.childAges, DEFAULT_CHILD_AGE] });
                        resetQuote();
                      }}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {room.childAges.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {room.childAges.map((age, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Label htmlFor={`child-${room.key}-${index}`} className="text-xs text-muted-foreground">
                        Child {index + 1} age
                      </Label>
                      <Input
                        id={`child-${room.key}-${index}`}
                        type="number"
                        min={0}
                        max={17}
                        value={age}
                        onChange={(e) => {
                          const next = [...room.childAges];
                          next[index] = Number(e.target.value);
                          updateRoom(room.key, { childAges: next });
                          resetQuote();
                        }}
                        className="w-16"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          updateRoom(room.key, { childAges: room.childAges.filter((_, i) => i !== index) });
                          resetQuote();
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {room.pricingModel === "per_person_per_night" && (
                <p className="mt-1 text-xs text-muted-foreground">This room&apos;s pricing requires at least 2 guests.</p>
              )}
              {roomQuote?.occupancyError && (
                <p className="mt-1 text-xs text-destructive">{roomQuote.occupancyError}</p>
              )}
              {roomQuote && !roomQuote.occupancyError && (
                <p className="mt-1 text-xs text-muted-foreground">
                  ₹{roomQuote.roomTotal.toLocaleString("en-IN")} for this room
                </p>
              )}
            </div>
          );
        })}

        {quoteError && (
          <Alert variant="destructive">
            <AlertDescription>{quoteError}</AlertDescription>
          </Alert>
        )}

        {!quote && (
          <Button onClick={handleCheckAvailability} disabled={quoteLoading || rooms.length === 0} className="w-full">
            {quoteLoading ? "Checking…" : "Check availability"}
          </Button>
        )}

        {quote && !quote.isAvailable && (
          <Alert variant="destructive">
            <AlertDescription>
              {quote.hasOccupancyErrors
                ? "Fix the room occupancy issues above."
                : "Not available for all selected dates/rooms. Try different dates or fewer rooms."}
            </AlertDescription>
          </Alert>
        )}

        {quote && quote.isAvailable && (
          <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-3">
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
              Change rooms or dates
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
