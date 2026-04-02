"use client";

import { useEffect, useRef, useState } from "react";
import { useMyPlaces } from "@/contexts/my-places-context";
import type { MyPlaceCheckIn } from "@/contexts/my-places-context";
import { getMapsApiKey, loadGoogleMapsApi } from "@/lib/maps";
import { routeQueryFromTitle } from "@/lib/route-planner";
import { usePlannerEvents } from "@/contexts/planner-events-context";
import type { PlannerEventItem } from "@/contexts/planner-events-context";

const DEFAULT_CENTER = { lat: 42.3601, lng: -71.0589 };

/** Same de-dupe as Directions — one pin per distinct place name. */
function uniquePlacesByName(checkIns: MyPlaceCheckIn[]): MyPlaceCheckIn[] {
  const seen = new Set<string>();
  const out: MyPlaceCheckIn[] = [];
  for (const c of checkIns) {
    const k = c.place.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

const PIN_CALENDAR = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
const PIN_MY_PLACE = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";

type PendingPin =
  | { kind: "calendar"; ev: PlannerEventItem; loc: google.maps.LatLng }
  | { kind: "place"; ci: MyPlaceCheckIn; loc: google.maps.LatLng };

type JitteredPin =
  | { kind: "calendar"; ev: PlannerEventItem; lat: number; lng: number }
  | { kind: "place"; ci: MyPlaceCheckIn; lat: number; lng: number };

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Opens Google Maps at exact coordinates (same pin position on the embedded map). */
function googleMapsUrlAt(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`;
}

function geocodeAddress(
  geocoder: google.maps.Geocoder,
  address: string,
): Promise<google.maps.LatLng | null> {
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
        resolve(results[0].geometry.location);
      } else {
        resolve(null);
      }
    });
  });
}

export function MapView() {
  const { events } = usePlannerEvents();
  const { checkIns } = useMyPlaces();
  const apiKey = getMapsApiKey();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const geocodeRunRef = useRef(0);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

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
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
    });
    mapInstanceRef.current = map;
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
    mapClickListenerRef.current = map.addListener("click", () => {
      infoWindowRef.current?.close();
    });
    setMapReady(true);
    return () => {
      mapClickListenerRef.current?.remove();
      mapClickListenerRef.current = null;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, [apiKey, scriptLoaded]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google?.maps) return;

    const runId = ++geocodeRunRef.current;
    const map = mapInstanceRef.current;
    const geocoder = new google.maps.Geocoder();
    const iw = infoWindowRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const myPlaces = uniquePlacesByName(checkIns);
    if (events.length === 0 && myPlaces.length === 0) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(12);
      return;
    }

    void (async () => {
      const pending: PendingPin[] = [];

      for (const ev of events) {
        const query = routeQueryFromTitle(ev.title);
        if (!query) continue;
        const loc = await geocodeAddress(geocoder, `${query}, Boston, MA`);
        if (runId !== geocodeRunRef.current) return;
        if (loc) pending.push({ kind: "calendar", ev, loc });
      }

      for (const ci of myPlaces) {
        const loc = await geocodeAddress(geocoder, `${ci.place.trim()}, Boston, MA`);
        if (runId !== geocodeRunRef.current) return;
        if (loc) pending.push({ kind: "place", ci, loc });
      }

      if (runId !== geocodeRunRef.current) return;

      const byKey = new Map<string, PendingPin[]>();
      for (const p of pending) {
        const lat = p.loc.lat();
        const lng = p.loc.lng();
        const key = `${lat.toFixed(5)}_${lng.toFixed(5)}`;
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key)!.push(p);
      }

      const jittered: JitteredPin[] = [];
      for (const bucket of byKey.values()) {
        const n = bucket.length;
        bucket.forEach((p, i) => {
          const lat = p.loc.lat();
          const lng = p.loc.lng();
          if (n <= 1) {
            if (p.kind === "calendar") {
              jittered.push({ kind: "calendar", ev: p.ev, lat, lng });
            } else {
              jittered.push({ kind: "place", ci: p.ci, lat, lng });
            }
          } else {
            const angle = (2 * Math.PI * i) / n;
            const r = 0.00018;
            const jLat = lat + r * Math.cos(angle);
            const jLng = lng + r * Math.sin(angle);
            if (p.kind === "calendar") {
              jittered.push({ kind: "calendar", ev: p.ev, lat: jLat, lng: jLng });
            } else {
              jittered.push({ kind: "place", ci: p.ci, lat: jLat, lng: jLng });
            }
          }
        });
      }

      if (runId !== geocodeRunRef.current) return;

      if (jittered.length === 0) {
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(12);
        return;
      }

      const bounds = new google.maps.LatLngBounds();

      for (const pin of jittered) {
        const pos = { lat: pin.lat, lng: pin.lng };
        const isCalendar = pin.kind === "calendar";
        const title = isCalendar ? pin.ev.title : pin.ci.place;
        const marker = new google.maps.Marker({
          map,
          position: pos,
          title,
          icon: isCalendar ? PIN_CALENDAR : PIN_MY_PLACE,
          optimized: false,
        });
        marker.addListener("click", () => {
          if (!iw) return;
          const mapsUrl = googleMapsUrlAt(pin.lat, pin.lng);
          if (isCalendar) {
            iw.setContent(
              `<div style="padding:4px 8px 6px;margin:0;max-width:min(260px,70vw);font-size:13px;line-height:1.3;font-family:system-ui,sans-serif;color:#0f172a">
                <div style="margin:0 0 2px;padding:0;font-size:11px;font-weight:600;color:#64748b">Calendar</div>
                <div style="margin:0 0 4px;padding:0">${escapeHtml(pin.ev.title)}</div>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;text-decoration:underline;display:inline-block">Open in Google Maps</a>
              </div>`,
            );
          } else {
            const sub = `${escapeHtml(pin.ci.category)} · ${escapeHtml(pin.ci.date)}`;
            iw.setContent(
              `<div style="padding:4px 8px 6px;margin:0;max-width:min(260px,70vw);font-size:13px;line-height:1.3;font-family:system-ui,sans-serif;color:#0f172a">
                <div style="margin:0 0 2px;padding:0;font-size:11px;font-weight:600;color:#64748b">My place</div>
                <div style="margin:0 0 4px;padding:0;font-weight:600">${escapeHtml(pin.ci.place)}</div>
                <div style="margin:0 0 4px;padding:0;font-size:12px;color:#64748b">${sub}</div>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;text-decoration:underline;display:inline-block">Open in Google Maps</a>
              </div>`,
            );
          }
          iw.open(map, marker);
        });
        markersRef.current.push(marker);
        bounds.extend(pos);
      }

      map.fitBounds(bounds);
    })();
  }, [events, checkIns, mapReady]);

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
            , enable <strong>Maps JavaScript API</strong> (Geocoding is included for the JS Geocoder).
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
