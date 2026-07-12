import { Users } from "lucide-react";
import { PropertyImage } from "./PropertyImage";
import { Button } from "@/components/ui/button";

export interface RoomTypeCardData {
  id: string;
  name: string;
  maxOccupancy: number;
  pricingModel: "per_night" | "per_person_per_night";
  basePriceB2C: number;
}

export function RoomTypeCard({ room, propertySlug }: { room: RoomTypeCardData; propertySlug: string }) {
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
        <Button size="sm" disabled title="Booking opens in a later phase">
          Select
        </Button>
      </div>
    </div>
  );
}
