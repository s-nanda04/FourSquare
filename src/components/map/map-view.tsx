"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

const center = { lat: 42.3601, lng: -71.0589 };
const markers = [
  { id: 1, lat: 42.3648, lng: -71.0547 },
  { id: 2, lat: 42.3467, lng: -71.0972 },
  { id: 3, lat: 42.3588, lng: -71.0678 },
];

export function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    if (!scriptLoaded) return;
    if (!mapRef.current) return;
    if (!window.google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
    });

    for (const marker of markers) {
      new google.maps.Marker({
        map,
        position: { lat: marker.lat, lng: marker.lng },
      });
    }
  }, [apiKey, scriptLoaded]);

  if (!apiKey) {
    return (
      <div className="planner-card flex h-[380px] items-center justify-center p-4 text-center text-slate-600">
        Add `NEXT_PUBLIC_GOOGLE_MAPS_KEY` to view map.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={mapRef} style={{ width: "100%", height: "380px" }} />
    </div>
  );
}
