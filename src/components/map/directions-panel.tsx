"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMyPlaces } from "@/contexts/my-places-context";
import { usePlannerEvents } from "@/contexts/planner-events-context";
import { getMapsApiKey, loadGoogleMapsApi } from "@/lib/maps";
import { routeQueryFromTitle } from "@/lib/route-planner";

/** Only used when the user denies location or the device has no geolocation. */
const FALLBACK_ORIGIN = { lat: 42.3601, lng: -71.0589 } as const;

/** Prefer GPS over Wi‑Fi/cell; network-only fixes often snap to the wrong building (e.g. a nearby residence). */
const GEO_INITIAL: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30_000,
  maximumAge: 0,
};

const GEO_WATCH: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30_000,
  maximumAge: 10_000,
};

/** Average step length (m) for rough step count from walking distance. */
const METERS_PER_STEP = 0.762;

/** Min time between Directions API calls (moving updates). */
const MIN_FETCH_MS = 12_000;
/** Refresh traffic / ETA on this interval even if you have not moved (driving + walking). */
const LIVE_REFRESH_MS = 45_000;
/** Request a new route when you move at least this far (meters). */
const MOVE_TO_FETCH_M = 40;

type DestOption = {
  key: string;
  group: "plan" | "place";
  label: string;
  query: string;
};

function buildDestinationOptions(
  events: { id: number; date: string; title: string }[],
  checkIns: { id: number; place: string }[],
): DestOption[] {
  const opts: DestOption[] = [];
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  for (const e of sortedEvents) {
    const rq = routeQueryFromTitle(e.title);
    if (!rq) continue;
    opts.push({
      key: `plan-${e.id}`,
      group: "plan",
      label: e.title,
      query: `${rq}, Boston, MA`,
    });
  }

  const seenPlace = new Set<string>();
  const sortedPlaces = [...checkIns].sort((a, b) => a.place.localeCompare(b.place));
  for (const c of sortedPlaces) {
    const k = c.place.trim().toLowerCase();
    if (!k || seenPlace.has(k)) continue;
    seenPlace.add(k);
    opts.push({
      key: `place-${c.id}`,
      group: "place",
      label: c.place,
      query: `${c.place.trim()}, Boston, MA`,
    });
  }

  return opts;
}

function distanceMeters(
  a: google.maps.LatLngLiteral,
  b: google.maps.LatLngLiteral,
): number {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

type TravelModeUi = "walking" | "driving";

export function DirectionsPanel() {
  const { events } = usePlannerEvents();
  const { checkIns } = useMyPlaces();

  const destinationOptions = useMemo(
    () => buildDestinationOptions(events, checkIns),
    [events, checkIns],
  );

  const [selectedKey, setSelectedKey] = useState("");

  const effectiveKey = useMemo(() => {
    if (destinationOptions.length === 0) return "";
    if (selectedKey && destinationOptions.some((o) => o.key === selectedKey)) return selectedKey;
    return destinationOptions[0].key;
  }, [destinationOptions, selectedKey]);

  const destinationQuery = useMemo(() => {
    const o = destinationOptions.find((x) => x.key === effectiveKey);
    return o?.query ?? null;
  }, [destinationOptions, effectiveKey]);

  const [travelMode, setTravelMode] = useState<TravelModeUi>("driving");
  const [eta, setEta] = useState<string | null>(null);
  const [stepsText, setStepsText] = useState<string | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);
  const [locationImprecise, setLocationImprecise] = useState(false);

  const apiKey = getMapsApiKey();

  const currentPosRef = useRef<google.maps.LatLngLiteral>(FALLBACK_ORIGIN);
  const lastFetchedPosRef = useRef<google.maps.LatLngLiteral | null>(null);
  const lastFetchTimeRef = useRef(0);
  const fetchInFlightRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      setError(null);
      return;
    }

    if (!destinationQuery) {
      setLoading(false);
      setEta(null);
      setStepsText(null);
      setDistanceText(null);
      setMapsUrl(null);
      setError(null);
      setRefreshing(false);
      return;
    }

    const routeDestination: string = destinationQuery;

    let cancelled = false;
    let watchId: number | undefined;
    let liveTimer: ReturnType<typeof setInterval> | undefined;

    function buildMapsUrl(
      origin: google.maps.LatLngLiteral,
      end: google.maps.LatLng,
      mode: TravelModeUi,
    ): string {
      const o = encodeURIComponent(`${origin.lat},${origin.lng}`);
      const d = encodeURIComponent(`${end.lat()},${end.lng()}`);
      const tm = mode === "driving" ? "driving" : "walking";
      return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=${tm}`;
    }

    function applyLeg(leg: google.maps.DirectionsLeg, origin: google.maps.LatLngLiteral, mode: TravelModeUi) {
      const etaLabel =
        mode === "driving" && leg.duration_in_traffic?.text
          ? leg.duration_in_traffic.text
          : leg.duration?.text ?? "—";
      setEta(etaLabel);
      setDistanceText(leg.distance?.text ?? "");
      if (mode === "walking") {
        const meters = leg.distance?.value ?? 0;
        setStepsText(Math.round(meters / METERS_PER_STEP).toLocaleString());
      } else {
        setStepsText(null);
      }
      const end = leg.end_location;
      setMapsUrl(buildMapsUrl(origin, end, mode));
      setUpdatedAt(new Date());
    }

    async function runDirections(
      ds: google.maps.DirectionsService,
      origin: google.maps.LatLngLiteral,
      mode: TravelModeUi,
      destination: string,
    ): Promise<{ ok: true; leg: google.maps.DirectionsLeg } | { ok: false; status: google.maps.DirectionsStatus }> {
      const base: google.maps.DirectionsRequest = {
        origin,
        destination,
        travelMode:
          mode === "driving" ? google.maps.TravelMode.DRIVING : google.maps.TravelMode.WALKING,
      };
      if (mode === "driving") {
        base.drivingOptions = {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        };
      }

      return new Promise((resolve) => {
        ds.route(base, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result?.routes?.[0]?.legs?.[0]) {
            resolve({ ok: true, leg: result.routes[0].legs[0] });
            return;
          }
          if (mode === "driving" && base.drivingOptions) {
            const { drivingOptions: _, ...noTraffic } = base;
            ds.route(noTraffic, (result2, status2) => {
              if (status2 === google.maps.DirectionsStatus.OK && result2?.routes?.[0]?.legs?.[0]) {
                resolve({ ok: true, leg: result2.routes[0].legs[0] });
              } else {
                resolve({ ok: false, status: status2 });
              }
            });
            return;
          }
          resolve({ ok: false, status });
        });
      });
    }

    async function fetchRoute(origin: google.maps.LatLngLiteral, opts: { initial: boolean; silent: boolean }) {
      if (cancelled || fetchInFlightRef.current) return;
      fetchInFlightRef.current = true;
      if (opts.initial) {
        setLoading(true);
      } else if (!opts.silent) {
        setRefreshing(true);
      }
      setError(null);

      try {
        await loadGoogleMapsApi();
      } catch {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
          setError("Could not load Google Maps.");
        }
        fetchInFlightRef.current = false;
        return;
      }
      if (cancelled) {
        fetchInFlightRef.current = false;
        return;
      }

      const ds = new google.maps.DirectionsService();
      const res = await runDirections(ds, origin, travelMode, routeDestination);
      if (cancelled) {
        fetchInFlightRef.current = false;
        return;
      }

      if (opts.initial) setLoading(false);
      setRefreshing(false);

      if (res.ok) {
        applyLeg(res.leg, origin, travelMode);
        lastFetchedPosRef.current = origin;
        lastFetchTimeRef.current = Date.now();
      } else {
        setEta(null);
        setStepsText(null);
        setDistanceText(null);
        setMapsUrl(null);
        if (res.status === google.maps.DirectionsStatus.ZERO_RESULTS) {
          setError(
            travelMode === "walking"
              ? "No walking route found. Try driving or another place."
              : "No driving route found. Try another destination.",
          );
        } else {
          setError(`Directions unavailable (${res.status}). Check Maps JavaScript API on your key.`);
        }
      }

      fetchInFlightRef.current = false;
    }

    function shouldFetchMoving(origin: google.maps.LatLngLiteral, now: number): boolean {
      const lastT = lastFetchTimeRef.current;
      const lastPos = lastFetchedPosRef.current;
      if (now - lastT >= MIN_FETCH_MS) return true;
      if (!lastPos) return true;
      return distanceMeters(lastPos, origin) >= MOVE_TO_FETCH_M;
    }

    function schedulePositionFetch(origin: google.maps.LatLngLiteral) {
      currentPosRef.current = origin;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const now = Date.now();
        if (!shouldFetchMoving(origin, now)) return;
        void fetchRoute(origin, { initial: false, silent: false });
      }, 350);
    }

    void (async () => {
      try {
        await loadGoogleMapsApi();
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError("Could not load Google Maps.");
        }
        return;
      }
      if (cancelled) return;

      let geoDenied = false;
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const o = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              currentPosRef.current = o;
              setUsingFallbackLocation(false);
              const acc = pos.coords.accuracy;
              setLocationImprecise(typeof acc === "number" && acc > 150);
              resolve();
            },
            () => {
              geoDenied = true;
              currentPosRef.current = FALLBACK_ORIGIN;
              setUsingFallbackLocation(true);
              setLocationImprecise(false);
              resolve();
            },
            GEO_INITIAL,
          );
        });
      } else {
        setUsingFallbackLocation(true);
      }

      if (cancelled) return;

      await fetchRoute(currentPosRef.current, { initial: true, silent: false });

      if (cancelled) return;

      if (navigator.geolocation && !geoDenied) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const o = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            const acc = pos.coords.accuracy;
            setLocationImprecise(typeof acc === "number" && acc > 150);
            schedulePositionFetch(o);
          },
          () => {
            setUsingFallbackLocation(true);
            currentPosRef.current = FALLBACK_ORIGIN;
          },
          GEO_WATCH,
        );
      }

      liveTimer = setInterval(() => {
        if (cancelled || fetchInFlightRef.current) return;
        void fetchRoute(currentPosRef.current, { initial: false, silent: true });
      }, LIVE_REFRESH_MS);
    })();

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (liveTimer !== undefined) clearInterval(liveTimer);
    };
  }, [destinationQuery, travelMode, apiKey]);

  if (!apiKey) {
    return (
      <div className="planner-card p-4">
        <h3 className="mb-3 font-semibold">Directions</h3>
        <p className="text-sm text-slate-600">
          Set NEXT_PUBLIC_GOOGLE_MAPS_KEY in <code className="rounded bg-slate-100 px-1">.env.local</code> to
          get directions.
        </p>
      </div>
    );
  }

  const timeLabel =
    updatedAt &&
    updatedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });

  const planOpts = destinationOptions.filter((o) => o.group === "plan");
  const placeOpts = destinationOptions.filter((o) => o.group === "place");

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Directions</h3>
      <p className="mb-2 text-xs text-slate-500">
        Live ETA
        {travelMode === "driving" ? " uses current traffic" : ""}; updates as you move and every{" "}
        {LIVE_REFRESH_MS / 1000}s.
        {usingFallbackLocation && " Location off — using downtown Boston as start."}
        {!usingFallbackLocation && locationImprecise && (
          <>
            {" "}
            Location is approximate — wait for a better GPS fix or move outdoors so the start pin matches where you
            are.
          </>
        )}
      </p>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">Destination</label>
      {destinationOptions.length === 0 ? (
        <p className="mb-3 text-sm text-slate-600">
          Add events on <strong>Calendar</strong> or check-ins on <strong>Places</strong> to choose where you’re going.
        </p>
      ) : (
        <select
          value={effectiveKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          disabled={loading}
          className="mb-3 h-8 w-full rounded-lg border border-gray-200 bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-60"
        >
          {planOpts.length > 0 ? (
            <optgroup label="Calendar plans">
              {planOpts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null}
          {placeOpts.length > 0 ? (
            <optgroup label="My places">
              {placeOpts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      )}
      <label className="mb-1.5 block text-xs font-medium text-slate-600">Mode (optimal route)</label>
      <select
        value={travelMode}
        onChange={(e) => setTravelMode(e.target.value as TravelModeUi)}
        disabled={loading || destinationOptions.length === 0}
        className="mb-2 h-8 w-full rounded-lg border border-gray-200 bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:opacity-60"
      >
        <option value="driving">Driving — fastest path with live traffic when available</option>
        <option value="walking">Walking — ETA and approx. steps</option>
      </select>
      {destinationOptions.length > 0 && loading && (
        <p className="mt-3 text-sm text-slate-600">Getting your location and optimal route…</p>
      )}
      {destinationOptions.length > 0 && !loading && error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      {destinationOptions.length > 0 && !loading && !error && eta && (
        <>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className="text-sm text-slate-600">
              ETA: <span className="font-semibold text-slate-900">{eta}</span>
              {distanceText ? <span className="text-slate-500"> · {distanceText}</span> : null}
            </p>
            {refreshing && (
              <span className="text-xs font-medium text-primary">Updating…</span>
            )}
          </div>
          {travelMode === "walking" && stepsText !== null && (
            <p className="text-sm text-slate-600">
              Steps (approx.): <span className="font-medium text-slate-900">{stepsText}</span>
            </p>
          )}
          {timeLabel && (
            <p className="mt-1 text-xs text-slate-400">Last updated {timeLabel}</p>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-primary underline underline-offset-2"
            >
              Open route in Google Maps
            </a>
          )}
        </>
      )}
    </div>
  );
}
