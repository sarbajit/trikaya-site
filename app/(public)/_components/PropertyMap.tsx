"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPlaceholder } from "./MapPlaceholder";

const LeafletMap = dynamic(() => import("./LeafletMap").then((m) => m.LeafletMap), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full rounded-md sm:h-72" />,
});

export function PropertyMap({
  address,
  geo,
  seedKey,
  googlePlaceId,
}: {
  address: string;
  geo?: { lat: number; lng: number };
  seedKey: string;
  googlePlaceId?: string;
}) {
  if (!geo) {
    return <MapPlaceholder address={address} seedKey={seedKey} />;
  }

  const googleMapsUrl = googlePlaceId
    ? `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}&query_place_id=${googlePlaceId}`
    : `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`;

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <LeafletMap address={address} geo={geo} googleMapsUrl={googleMapsUrl} />
    </div>
  );
}
