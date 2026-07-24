"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const markerIcon = L.divIcon({
  className: "text-primary",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="drop-shadow-md">
    <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 6.6 14.6 7.2 15.4a1 1 0 0 0 1.6 0C13.4 22.6 20 13.4 20 8c0-4.4-3.6-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});


export function LeafletMap({
  address,
  geo,
  googleMapsUrl,
}: {
  address: string;
  geo: { lat: number; lng: number };
  googleMapsUrl: string;
}) {
  return (
    <MapContainer
      center={[geo.lat, geo.lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-56 w-full sm:h-72"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[geo.lat, geo.lng]} icon={markerIcon}>
        <Popup>
          <span className="text-sm">{address}</span>
          <br />
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Get directions
          </a>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
