"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users } from "lucide-react";
import { PropertyImage } from "./PropertyImage";
import { Button } from "@/components/ui/button";

/** Custom event RoomTypeCard broadcasts on "Select"; BookingWidget listens for it. */
export const SELECT_ROOM_EVENT = "trikaya:select-room";

export interface RoomTypeCardData {
  id: string;
  name: string;
  maxOccupancy: number;
  pricingModel: "per_night" | "per_person_per_night";
  basePriceB2C: number;
}

export function RoomTypeCard({ room, propertySlug }: { room: RoomTypeCardData; propertySlug: string }) {
  const { status } = useSession();
  const router = useRouter();

  function handleSelect() {
    // Session status starts as "loading" for a moment on first paint; acting
    // before it resolves could send a logged-out user straight to the
    // property page instead of the login page. The button stays disabled
    // until status is known, so this is just a defensive guard.
    if (status === "loading") return;

    const propertyUrl = `/properties/${propertySlug}?room=${room.id}#booking-widget`;

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(propertyUrl)}`);
      return;
    }

    // Already on the property page (booking widget present in the DOM): just
    // select in place. Otherwise (e.g. the single-property homepage, which
    // has no booking widget of its own) navigate to the property page.
    const widget = document.getElementById("booking-widget");
    if (widget) {
      window.dispatchEvent(new CustomEvent(SELECT_ROOM_EVENT, { detail: room.id }));
      widget.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    router.push(propertyUrl);
  }

  return (
    <div className="grid gap-4 rounded-md border border-border bg-card p-3 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:p-4">
      <PropertyImage
        seedKey={`${propertySlug}-room-${room.id}`}
        alt={room.name}
        className="aspect-[4/3] rounded-sm sm:aspect-square"
      />
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-base text-foreground">{room.name}</h3>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-3.5" /> Up to {room.maxOccupancy} guests
        </span>
      </div>
      <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        <div className="text-right">
          <span className="text-lg font-semibold text-foreground">₹{room.basePriceB2C.toLocaleString("en-IN")}</span>
          <span className="text-sm text-muted-foreground">
            {" "}
            / {room.pricingModel === "per_night" ? "night" : "person / night"}
          </span>
        </div>
        <Button size="sm" onClick={handleSelect} disabled={status === "loading"}>
          Select
        </Button>
      </div>
    </div>
  );
}
