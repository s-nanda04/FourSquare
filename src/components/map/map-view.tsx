"use client";

import { useEffect, useRef, useState } from "react";
import { getMapsApiKey, loadGoogleMapsApi } from "@/lib/maps";

const DEFAULT_CENTER = { lat: 42.3601, lng: -71.0589 };

export function MapView() {
  const apiKey = getMapsApiKey();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMapsApi()
      .then(() => setScriptLoaded(true))
      .catch(() => setScriptLoaded(false));
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || !scriptLoaded || !mapRef.current || !window.google?.maps) return;
    const map = new google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
    });
    return () => {
      mapClickListenerRef.current?.remove();
      mapClickListenerRef.current = null;
    };
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
            Create an API key and add it to{" "}
            <code className="rounded bg-slate-100 px-1">.env.local</code>:
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
      <div className="planner-card flex min-h-[min(60vh,480px)] flex-1 items-center justify-center p-4 text-slate-600">
        Loading map…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
      <div
        ref={mapRef}
        className="min-h-[min(70vh,720px)] w-full flex-1"
        style={{ minHeight: "min(70vh, 720px)" }}
      />
    </div>
  );
}
