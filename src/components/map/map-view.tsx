"use client";

import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";

const center = { lat: 42.3601, lng: -71.0589 };
const markers = [
  { id: 1, lat: 42.3648, lng: -71.0547 },
  { id: 2, lat: 42.3467, lng: -71.0972 },
  { id: 3, lat: 42.3588, lng: -71.0678 },
];

export function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    return (
      <div className="planner-card flex h-[380px] items-center justify-center p-4 text-center text-slate-600">
        Add `NEXT_PUBLIC_GOOGLE_MAPS_KEY` to view map.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap mapContainerStyle={{ width: "100%", height: "380px" }} center={center} zoom={12}>
          {markers.map((marker) => (
            <MarkerF key={marker.id} position={{ lat: marker.lat, lng: marker.lng }} />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
