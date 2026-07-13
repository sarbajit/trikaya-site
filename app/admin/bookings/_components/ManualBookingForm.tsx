"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PropertyOption {
  id: string;
  name: string;
}

interface RoomTypeOption {
  id: string;
  propertyId: string;
  name: string;
  maxOccupancy: number;
  pricingModel: "per_night" | "per_person_per_night";
}

interface CustomerOption {
  id: string;
  name: string;
  email: string;
}

interface RoomSelection {
  key: string;
  roomTypeId: string;
  roomTypeName: string;
  maxOccupancy: number;
  pricingModel: "per_night" | "per_person_per_night";
  adults: number;
  childAges: number[];
}

interface QuoteRoom {
  roomTypeId: string;
  roomTotal: number;
  occupancyError: string | null;
}

interface BookingQuote {
  nights: number;
  currency: string;
  rooms: QuoteRoom[];
  totalAmount: number;
  isAvailable: boolean;
  hasOccupancyErrors: boolean;
}

const DEFAULT_CHILD_AGE = 8;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ManualBookingForm({
  properties,
  roomTypes,
  customers,
  initialPropertyId,
  initialDate,
}: {
  properties: PropertyOption[];
  roomTypes: RoomTypeOption[];
  customers: CustomerOption[];
  initialPropertyId?: string;
  initialDate?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [propertyId, setPropertyId] = useState(
    initialPropertyId ?? (properties.length === 1 ? properties[0].id : "")
  );
  const [checkIn, setCheckIn] = useState(initialDate ?? "");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState<RoomSelection[]>([]);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(customers.length > 0 ? "existing" : "new");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const roomTypesForProperty = roomTypes.filter((rt) => rt.propertyId === propertyId);
  const quoteByRoomTypeId = new Map((quote?.rooms ?? []).map((r) => [r.roomTypeId, r]));

  function resetQuote() {
    setQuote(null);
    setQuoteError(null);
    setSubmitError(null);
  }

  function addRoom(roomTypeId: string) {
    const roomType = roomTypesForProperty.find((rt) => rt.id === roomTypeId);
    if (!roomType) return;
    setRooms((prev) => [
      ...prev,
      {
        key: `${roomTypeId}-${Date.now()}-${Math.random()}`,
        roomTypeId,
        roomTypeName: roomType.name,
        maxOccupancy: roomType.maxOccupancy,
        pricingModel: roomType.pricingModel,
        adults: 1,
        childAges: [],
      },
    ]);
    resetQuote();
  }

  function updateRoom(key: string, patch: Partial<RoomSelection>) {
    setRooms((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    resetQuote();
  }

  function removeRoom(key: string) {
    setRooms((prev) => prev.filter((r) => r.key !== key));
    resetQuote();
  }

  async function handleCheckAvailability() {
    if (!propertyId || rooms.length === 0 || !checkIn || !checkOut) {
      setQuoteError("Choose a property, at least one room, and both dates.");
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

  async function handleSubmit() {
    if (!quote || !quote.isAvailable) return;
    if (customerMode === "existing" && !selectedCustomerId) {
      setSubmitError("Choose a customer.");
      return;
    }
    if (customerMode === "new" && (!newCustomerName.trim() || !newCustomerEmail.trim())) {
      setSubmitError("Enter the new customer's name and email.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          checkIn,
          checkOut,
          rooms: rooms.map((r) => ({ roomTypeId: r.roomTypeId, adults: r.adults, childAges: r.childAges })),
          customerMode,
          userId: customerMode === "existing" ? selectedCustomerId : undefined,
          newCustomer:
            customerMode === "new"
              ? { name: newCustomerName.trim(), email: newCustomerEmail.trim(), phone: newCustomerPhone.trim() || undefined }
              : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const fieldError = data?.error?.fieldErrors?.["newCustomer.email"]?.[0];
        setSubmitError(fieldError ?? (typeof data.error === "string" ? data.error : "Could not create the booking."));
        return;
      }
      toast({ title: "Booking created.", variant: "success" });
      router.push(`/admin/bookings/${data.bookingId}`);
    } catch {
      setSubmitError("Something went wrong creating the booking. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Property &amp; dates</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length > 1 && (
            <FormField label="Property" htmlFor="propertyId" required>
              <Select
                value={propertyId}
                onValueChange={(v) => {
                  setPropertyId(v);
                  setRooms([]);
                  resetQuote();
                }}
              >
                <SelectTrigger id="propertyId">
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Check-in" htmlFor="checkIn" required>
              <Input
                id="checkIn"
                type="date"
                min={todayISO()}
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  resetQuote();
                }}
              />
            </FormField>
            <FormField label="Check-out" htmlFor="checkOut" required>
              <Input
                id="checkOut"
                type="date"
                min={checkIn || todayISO()}
                value={checkOut}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  resetQuote();
                }}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {!propertyId && <p className="text-sm text-muted-foreground">Choose a property first.</p>}

          {propertyId && (
            <FormField label="Add a room" htmlFor="addRoom">
              <Select value="" onValueChange={addRoom}>
                <SelectTrigger id="addRoom">
                  <SelectValue placeholder="Choose a room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypesForProperty.map((rt) => (
                    <SelectItem key={rt.id} value={rt.id}>
                      {rt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <div className="mt-3 flex flex-col gap-3">
            {rooms.map((room) => {
              const maxChildren = Math.max(0, room.maxOccupancy - room.adults);
              const roomQuote = quoteByRoomTypeId.get(room.roomTypeId);
              return (
                <div key={room.key} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{room.roomTypeName}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRoom(room.key)}>
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
                        onChange={(e) => updateRoom(room.key, { adults: Number(e.target.value) })}
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
                          onClick={() => updateRoom(room.key, { childAges: [...room.childAges, DEFAULT_CHILD_AGE] })}
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
                          <Label className="text-xs text-muted-foreground">Child {index + 1} age</Label>
                          <Input
                            type="number"
                            min={0}
                            max={17}
                            value={age}
                            onChange={(e) => {
                              const next = [...room.childAges];
                              next[index] = Number(e.target.value);
                              updateRoom(room.key, { childAges: next });
                            }}
                            className="w-16"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              updateRoom(room.key, { childAges: room.childAges.filter((_, i) => i !== index) })
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {roomQuote?.occupancyError && <p className="mt-1 text-xs text-destructive">{roomQuote.occupancyError}</p>}
                  {roomQuote && !roomQuote.occupancyError && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ₹{roomQuote.roomTotal.toLocaleString("en-IN")} for this room
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {quoteError && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{quoteError}</AlertDescription>
            </Alert>
          )}

          {!quote && (
            <Button
              type="button"
              onClick={handleCheckAvailability}
              disabled={quoteLoading || rooms.length === 0}
              className="mt-3"
            >
              {quoteLoading ? "Checking…" : "Check availability"}
            </Button>
          )}

          {quote && !quote.isAvailable && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>
                {quote.hasOccupancyErrors
                  ? "Fix the room occupancy issues above."
                  : "Not available for all selected dates/rooms. Try different dates or fewer rooms."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {quote && quote.isAvailable && (
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={customerMode === "existing" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerMode("existing")}
              >
                Existing customer
              </Button>
              <Button
                type="button"
                variant={customerMode === "new" ? "default" : "outline"}
                size="sm"
                onClick={() => setCustomerMode("new")}
              >
                New customer
              </Button>
            </div>

            {customerMode === "existing" ? (
              <FormField label="Customer" htmlFor="customerId" required className="mt-3">
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger id="customerId">
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                <FormField label="Name" htmlFor="newCustomerName" required>
                  <Input id="newCustomerName" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
                </FormField>
                <FormField label="Email" htmlFor="newCustomerEmail" required>
                  <Input
                    id="newCustomerEmail"
                    type="email"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                  />
                </FormField>
                <FormField label="Phone" htmlFor="newCustomerPhone">
                  <Input id="newCustomerPhone" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
                </FormField>
              </div>
            )}

            <div className="mt-4 flex justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
              <span>
                Total ({quote.nights} night{quote.nights > 1 ? "s" : ""})
              </span>
              <span>₹{quote.totalAmount.toLocaleString("en-IN")}</span>
            </div>

            {submitError && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button type="button" onClick={handleSubmit} disabled={submitLoading} className="mt-4 w-full">
              {submitLoading ? "Creating…" : "Create booking"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
