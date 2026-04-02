"use client";

import { useCallback, useEffect, useState } from "react";
import { getMapsApiKey } from "@/lib/maps";
import { fetchNearbyPlacesForDiscover } from "@/lib/places-nearby";
import type { PlaceCardPlace } from "@/components/places/place-card";

export type GeoStatus = "loading" | "ok" | "denied" | "error" | "unsupported";

export function useDiscoverNearby(distanceMiles: number, category: string) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("loading");
  const [googlePlaces, setGooglePlaces] = useState<PlaceCardPlace[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      (err) => {
        if (err.code === 1) setGeoStatus("denied");
        else setGeoStatus("error");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 120000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!coords || !getMapsApiKey()) {
      setGooglePlaces([]);
      setNearbyError(null);
      setNearbyLoading(false);
      return;
    }
    let cancelled = false;
    setNearbyLoading(true);
    setNearbyError(null);
    void fetchNearbyPlacesForDiscover(coords.lat, coords.lng, distanceMiles, category)
      .then((places) => {
        if (!cancelled) setGooglePlaces(places);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setGooglePlaces([]);
          setNearbyError(e instanceof Error ? e.message : "Could not load nearby places.");
        }
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, distanceMiles, category]);

  return { coords, geoStatus, googlePlaces, nearbyLoading, nearbyError, requestLocation };
}
