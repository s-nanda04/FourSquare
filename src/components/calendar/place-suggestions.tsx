"use client";

import { useEffect, useState } from "react";
import { getMapsApiKey, loadGoogleMapsApi } from "@/lib/maps";
import { cn } from "@/lib/utils";

type PickPayload = {
  title: string;
  mapsUrl: string;
};

export function PlaceSuggestions({
  query,
  onPick,
  className,
}: {
  query: string;
  onPick: (payload: PickPayload) => void;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!getMapsApiKey()) {
      setLoadError("Add NEXT_PUBLIC_GOOGLE_MAPS_KEY for place search.");
      return;
    }
    loadGoogleMapsApi()
      .then(() => setReady(true))
      .catch(() => setLoadError("Could not load Google Places. Enable Places API on your key."));
  }, []);

  useEffect(() => {
    if (!ready || query.trim().length < 2) {
      setPredictions([]);
      return;
    }

    const t = window.setTimeout(() => {
      const service = new google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query.trim(),
          types: ["restaurant"],
          componentRestrictions: { country: "us" },
        },
        (results, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK &&
            status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            setPredictions([]);
            return;
          }
          setPredictions(results?.slice(0, 8) ?? []);
        },
      );
    }, 280);

    return () => window.clearTimeout(t);
  }, [query, ready]);

  if (loadError) {
    return <p className="text-xs text-amber-800">{loadError}</p>;
  }

  if (!predictions.length) return null;

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      <p className="border-b border-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
        Restaurants near you (Google Maps)
      </p>
      <ul className="max-h-52 overflow-auto">
        {predictions.map((p) => (
          <li key={p.place_id} className="border-b border-slate-50 last:border-0">
            <button
              type="button"
              className="w-full px-3 py-2 text-left transition hover:bg-slate-50"
              onClick={() => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.description)}&query_place_id=${encodeURIComponent(p.place_id)}`;
                onPick({
                  title: p.structured_formatting.main_text,
                  mapsUrl,
                });
                setPredictions([]);
              }}
            >
              <span className="block font-medium text-slate-900">
                {p.structured_formatting.main_text}
              </span>
              <span className="block text-xs text-slate-500">
                {p.structured_formatting.secondary_text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
