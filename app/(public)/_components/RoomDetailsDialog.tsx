"use client";

import { Users } from "lucide-react";
import { AmenityIcon } from "./AmenityIcon";
import { RoomImageSlider } from "./RoomImageSlider";
import type { RoomTypeCardData } from "./RoomTypeCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface RoomDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomTypeCardData;
  propertySlug: string;
  onAdd: () => void;
  addDisabled: boolean;
}

export function RoomDetailsDialog({ open, onOpenChange, room, propertySlug, onAdd, addDisabled }: RoomDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{room.name}</DialogTitle>

        <RoomImageSlider
          images={room.images ?? []}
          seedKey={`${propertySlug}-room-${room.id}`}
          className="mt-2 aspect-[4/3] w-full"
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" /> Up to {room.maxOccupancy} guests
          </span>
          <div className="text-right">
            <span className="text-xl font-semibold text-foreground">₹{room.basePriceB2C.toLocaleString("en-IN")}</span>
            <span className="text-sm text-muted-foreground">
              {" "}
              / {room.pricingModel === "per_night" ? "night" : "person / night"}
            </span>
          </div>
        </div>

        {room.amenities && room.amenities.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-foreground">Amenities</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {room.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm text-foreground/80"
                >
                  <AmenityIcon label={amenity} className="size-3.5 text-primary" /> {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <Button className="mt-5 w-fit" onClick={onAdd} disabled={addDisabled}>
          Add room
        </Button>
      </DialogContent>
    </Dialog>
  );
}
