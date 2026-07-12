"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface SearchFilterBarProps {
  destinations: string[];
  amenities: string[];
  priceBounds: { min: number; max: number };
  initial: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities: string[];
  };
}

export function SearchFilterBar({ destinations, amenities, priceBounds, initial }: SearchFilterBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(initial.destination ?? "");
  const [checkIn, setCheckIn] = useState(initial.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial.checkOut ?? "");
  const [guests, setGuests] = useState(initial.guests ?? 2);
  const [price, setPrice] = useState<[number, number]>([
    initial.minPrice ?? priceBounds.min,
    initial.maxPrice ?? priceBounds.max,
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initial.amenities);

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    if (price[0] !== priceBounds.min) params.set("minPrice", String(price[0]));
    if (price[1] !== priceBounds.max) params.set("maxPrice", String(price[1]));
    if (selectedAmenities.length) params.set("amenities", selectedAmenities.join(","));
    router.push(`/properties?${params.toString()}`);
  }

  function clearFilters() {
    setDestination("");
    setCheckIn("");
    setCheckOut("");
    setGuests(2);
    setPrice([priceBounds.min, priceBounds.max]);
    setSelectedAmenities([]);
    router.push("/properties");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label>Destination</Label>
          <Select value={destination || undefined} onValueChange={(v) => setDestination(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Any destination" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Check-in</Label>
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Check-out</Label>
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} min={checkIn || undefined} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Guests</Label>
          <Input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Price range (per night, from)</Label>
            <span className="text-xs text-muted-foreground">
              ₹{price[0].toLocaleString("en-IN")} – ₹{price[1].toLocaleString("en-IN")}
            </span>
          </div>
          <Slider
            value={price}
            min={priceBounds.min}
            max={priceBounds.max}
            step={100}
            onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Amenities</Label>
          <div className="flex max-h-24 flex-wrap gap-x-4 gap-y-2 overflow-y-auto pr-1">
            {amenities.map((amenity) => (
              <label key={amenity} className="flex items-center gap-2 text-sm text-foreground/80">
                <Checkbox checked={selectedAmenities.includes(amenity)} onCheckedChange={() => toggleAmenity(amenity)} />
                {amenity}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={applyFilters}>
          <Search /> Search properties
        </Button>
        <Button variant="ghost" onClick={clearFilters}>
          <X /> Clear filters
        </Button>
      </div>
    </div>
  );
}
