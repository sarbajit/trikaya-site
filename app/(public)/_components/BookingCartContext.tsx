"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type PricingModel = "per_night" | "per_person_per_night";

export interface CartRoom {
  key: string;
  roomTypeId: string;
  roomTypeName: string;
  maxOccupancy: number;
  pricingModel: PricingModel;
  adults: number;
  childAges: number[];
}

interface AddRoomInput {
  roomTypeId: string;
  roomTypeName: string;
  maxOccupancy: number;
  pricingModel: PricingModel;
}

interface BookingCartContextValue {
  checkIn: string;
  checkOut: string;
  setCheckIn: (value: string) => void;
  setCheckOut: (value: string) => void;
  rooms: CartRoom[];
  addRoom: (input: AddRoomInput) => void;
  updateRoom: (key: string, patch: Partial<Pick<CartRoom, "adults" | "childAges">>) => void;
  removeRoom: (key: string) => void;
}

const BookingCartContext = createContext<BookingCartContextValue | null>(null);

let nextKey = 0;

export function BookingCartProvider({ children }: { children: ReactNode }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState<CartRoom[]>([]);

  function addRoom(input: AddRoomInput) {
    const defaultAdults = input.pricingModel === "per_person_per_night" ? Math.min(2, input.maxOccupancy) : 1;
    setRooms((prev) => [...prev, { key: String(nextKey++), adults: defaultAdults, childAges: [], ...input }]);
  }

  function updateRoom(key: string, patch: Partial<Pick<CartRoom, "adults" | "childAges">>) {
    setRooms((prev) => prev.map((room) => (room.key === key ? { ...room, ...patch } : room)));
  }

  function removeRoom(key: string) {
    setRooms((prev) => prev.filter((room) => room.key !== key));
  }

  return (
    <BookingCartContext.Provider
      value={{ checkIn, setCheckIn, checkOut, setCheckOut, rooms, addRoom, updateRoom, removeRoom }}
    >
      {children}
    </BookingCartContext.Provider>
  );
}

/** For consumers that may render outside a provider (e.g. RoomTypeCard on the single-property homepage). */
export function useOptionalBookingCart(): BookingCartContextValue | null {
  return useContext(BookingCartContext);
}

/** For consumers that always render inside a provider (e.g. BookingWidget on the property detail page). */
export function useBookingCart(): BookingCartContextValue {
  const ctx = useContext(BookingCartContext);
  if (!ctx) {
    throw new Error("useBookingCart must be used within a BookingCartProvider");
  }
  return ctx;
}
