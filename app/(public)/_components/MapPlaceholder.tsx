import { MapPin } from "lucide-react";
import { PropertyImage } from "./PropertyImage";

export function MapPlaceholder({ address, seedKey }: { address: string; seedKey: string }) {
  return (
    <div className="relative overflow-hidden rounded-md border border-border">
      <PropertyImage seedKey={`${seedKey}-map`} alt="" className="h-56 w-full opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55 px-6 text-center">
        <MapPin className="size-6 text-primary" aria-hidden />
        <p className="text-sm font-medium text-foreground">{address}</p>
        <p className="text-xs text-muted-foreground">Interactive map coming soon</p>
      </div>
    </div>
  );
}
