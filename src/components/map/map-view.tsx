"use client";

import { useEffect, useRef, useState } from "react";

const center = { lat: 42.3601, lng: -71.0589 };
const markers = [
  { id: 1, lat: 42.3648, lng: -71.0547 },
  { id: 2, lat: 42.3467, lng: -71.0972 },
  { id: 3, lat: 42.3588, lng: -71.0678 },
];

function getMapsApiKey(): string | undefined {
  const a = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY?.trim();
  const b = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return a || b || undefined;
}

export function MapView() {
  const apiKey = getMapsApiKey();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptLoaded(false);
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || !scriptLoaded || !mapRef.current || !window.google?.maps) return;
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
    });
    for (const marker of markers) {
      new google.maps.Marker({ map, position: { lat: marker.lat, lng: marker.lng } });
    }
  }, [apiKey, scriptLoaded]);

  if (!apiKey) {
    return (
      <div className="planner-card flex min-h-[380px] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-base font-semibold text-slate-900">Live map needs a Google Maps API key</p>
        <ol className="max-w-md list-decimal space-y-2 pl-5 text-left text-sm text-slate-600">
          <li>
            In{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud Console
            </a>
            , enable <strong>Maps JavaScript API</strong>.
          </li>
          <li>
            Create an API key (APIs &amp; Services → Credentials) and restrict it to your site (e.g.{" "}
            <code className="rounded bg-slate-100 px-1">http://localhost:3000/*</code>).
          </li>
          <li>
            Add to <code className="rounded bg-slate-100 px-1">.env.local</code>:
            <br />
            <code className="mt-1 block rounded bg-slate-100 px-2 py-1 text-left text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here
            </code>
          </li>
          <li>Restart <code className="rounded bg-slate-100 px-1">npm run dev</code>.</li>
        </ol>
      </div>
    );
  }

  if (!scriptLoaded) {
    return (
      <div className="planner-card flex h-[380px] items-center justify-center p-4 text-slate-600">
        Loading map…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <div ref={mapRef} className="bg-slate-100" style={{ width: "100%", height: "380px" }} />
    </div>
  );
}
