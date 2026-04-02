"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/discover/filter-bar";
import { RecommendationFeed } from "@/components/discover/recommendation-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDiscover, resolveGroupId, voteForPlace } from "@/lib/discover-api";
import { haversineMiles } from "@/lib/geo";
import { getMapsApiKey } from "@/lib/maps";
import { useDiscoverNearby } from "@/hooks/use-discover-nearby";
import { sortDiscoverPlaces, type DiscoverSortKey } from "@/lib/discover-sort";
import type { DiscoverRecommendation } from "@/types/discover";
import type { PlaceCardPlace } from "@/components/places/place-card";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80";

function matchesCategory(apiCategory: string, selected: string): boolean {
  const c = apiCategory.toLowerCase();
  if (selected === "Food") {
    return ["restaurant", "food", "bar", "meal", "dining"].some((k) => c.includes(k));
  }
  if (selected === "Cafes") {
    return ["cafe", "coffee", "bakery"].some((k) => c.includes(k));
  }
  if (selected === "Events") {
    return ["event", "night", "music", "theater", "stadium"].some((k) => c.includes(k));
  }
  if (selected === "Activities") {
    return ["activity", "park", "outdoor", "gym", "sport", "tour"].some((k) => c.includes(k));
  }
  return true;
}

function toCardPlace(
  r: DiscoverRecommendation,
  userLat?: number,
  userLng?: number,
): PlaceCardPlace {
  let distanceStr = r.formatted_address?.slice(0, 80) ?? "Near your group";
  if (
    userLat != null &&
    userLng != null &&
    Number.isFinite(r.lat) &&
    Number.isFinite(r.lng)
  ) {
    const mi = haversineMiles(userLat, userLng, r.lat, r.lng);
    const addr = r.formatted_address?.trim();
    distanceStr = `${mi.toFixed(1)} mi${addr ? ` • ${addr.slice(0, 56)}` : ""}`;
  }
  return {
    id: r.id,
    name: r.name,
    category: r.category || "Place",
    distance: distanceStr,
    image: PLACEHOLDER_IMG,
    subtitle: r.formatted_address ?? undefined,
    rating: undefined,
  };
}

export default function DiscoverPage() {
  const [category, setCategory] = useState("Food");
  const [distance, setDistance] = useState(10);
  const [sortBy, setSortBy] = useState<DiscoverSortKey>("distance");
  const [raw, setRaw] = useState<DiscoverRecommendation[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  /** Partner FastAPI unreachable (e.g. localhost:8000 not running) — not a hard error. */
  const [partnerApiOffline, setPartnerApiOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteHint, setVoteHint] = useState<string | null>(null);
  const [suggestedIds, setSuggestedIds] = useState<string[]>([]);

  const {
    coords,
    geoStatus,
    googlePlaces,
    nearbyLoading,
    nearbyError,
    requestLocation,
  } = useDiscoverNearby(distance, category);

  const load = useCallback(async () => {
    setApiLoading(true);
    setError(null);
    setPartnerApiOffline(false);
    try {
      const gid = await resolveGroupId();
      setGroupId(gid);
      if (!gid) {
        setRaw([]);
        return;
      }
      const res = await fetchDiscover(gid);
      setRaw(res.recommendations ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load discover feed.";
      if (msg.includes("Cannot reach API")) {
        setPartnerApiOffline(true);
        setRaw([]);
      } else {
        setError(msg);
        setRaw([]);
      }
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rawInRadius = useMemo(() => {
    if (!coords) return raw;
    return raw.filter(
      (r) => haversineMiles(coords.lat, coords.lng, r.lat, r.lng) <= distance,
    );
  }, [raw, coords, distance]);

  const filteredApiPlaces = useMemo(() => {
    const mapped = rawInRadius.map((r) => toCardPlace(r, coords?.lat, coords?.lng));
    const filtered = mapped.filter((p) =>
      matchesCategory(String(p.category), category),
    );
    return filtered.length > 0 ? filtered : mapped;
  }, [rawInRadius, category, coords]);

  const hasMapsKey = Boolean(getMapsApiKey());

  const sortedGroupPlaces = useMemo(
    () => sortDiscoverPlaces(filteredApiPlaces, sortBy),
    [filteredApiPlaces, sortBy],
  );

  const hasGoogleExplore =
    Boolean(coords && hasMapsKey && googlePlaces.length > 0 && !nearbyLoading);

  const exploreBase = useMemo(() => {
    if (hasGoogleExplore) return googlePlaces;
    return [] as PlaceCardPlace[];
  }, [hasGoogleExplore, googlePlaces]);

  const sortedExplorePlaces = useMemo(
    () => sortDiscoverPlaces(exploreBase, sortBy),
    [exploreBase, sortBy],
  );

  const handleSuggest = async (id: string | number) => {
    const sid = String(id);
    if (suggestedIds.includes(sid) || !groupId) return;
    setVoteHint(null);
    try {
      await voteForPlace(groupId, sid, 1);
      setSuggestedIds((prev) => [...prev, sid]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vote failed";
      setVoteHint(msg.includes("Cannot reach API") ? "Partner API offline — start it to suggest to the group." : msg);
    }
  };

  const showGroupFeed = Boolean(groupId && sortedGroupPlaces.length > 0 && !apiLoading);

  const distanceSubtext = useMemo(() => {
    if (geoStatus === "loading") return "Locating you…";
    if (geoStatus === "ok" && coords) {
      return `Search radius is measured from your current position (${distance} mi).`;
    }
    if (geoStatus === "denied") {
      return "Allow location in the browser to filter by distance and load Google results near you.";
    }
    if (geoStatus === "error") {
      return "Could not read your location — try “Use my location” or check browser permissions.";
    }
    if (geoStatus === "unsupported") {
      return "This environment doesn’t support geolocation.";
    }
    return undefined;
  }, [geoStatus, coords, distance]);

  const exploreBlurb = (() => {
    if (hasGoogleExplore) {
      return "Venues from Google Maps within your selected radius and category.";
    }
    if (coords && hasMapsKey && nearbyError) {
      return `${nearbyError} Fix the issue above to load live venues — demo cards are disabled.`;
    }
    if (!hasMapsKey) {
      return "Set NEXT_PUBLIC_GOOGLE_MAPS_KEY and enable Places API to search live venues near your position.";
    }
    if (geoStatus === "denied" || geoStatus === "error") {
      return "Allow location (or fix permissions) to load Google Places near you — no offline sample list.";
    }
    if (nearbyLoading && coords && hasMapsKey) {
      return "Loading nearby venues…";
    }
    return "No venues loaded yet — use “Use my location” and ensure the Places API returns results for your filters.";
  })();

  return (
    <div className="space-y-6">
      <FilterBar
        selectedCategory={category}
        onCategoryChange={setCategory}
        distance={distance}
        onDistanceChange={setDistance}
        sortBy={sortBy}
        onSortChange={setSortBy}
        distanceSubtext={distanceSubtext}
        locationStatus={geoStatus}
        onRetryLocation={() => requestLocation()}
      />

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>
            {error}{" "}
            <button type="button" className="underline" onClick={() => void load()}>
              Retry
            </button>
          </p>
        </div>
      ) : null}

      {voteHint ? (
        <p className="text-sm text-amber-800" role="status">
          {voteHint}
        </p>
      ) : null}

      {groupId && apiLoading ? (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">Suggested for your group</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="planner-card p-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showGroupFeed ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Suggested for your group</h2>
          <RecommendationFeed
            places={sortedGroupPlaces}
            suggestedIds={suggestedIds}
            onSuggest={(id) => void handleSuggest(id)}
            emptyMessage="No group picks for this filter yet."
          />
        </section>
      ) : null}

      {groupId &&
      !apiLoading &&
      raw.length > 0 &&
      filteredApiPlaces.length === 0 &&
      coords ? (
        <p className="text-sm text-slate-600">
          No group picks within {distance} mi of your location — increase distance or pick another category.
        </p>
      ) : null}

      {groupId && !apiLoading && raw.length === 0 && !error && !partnerApiOffline ? (
        <p className="text-sm text-slate-600">
          No places in your database yet — browse below, or add rows to{" "}
          <code className="rounded bg-slate-100 px-1">places</code> in Supabase for personalized picks.
        </p>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {hasGoogleExplore ? "Near you (Google Maps)" : "Explore (Google Maps)"}
          </h2>
          <p className="text-sm text-slate-600">{exploreBlurb}</p>
        </div>
        {nearbyLoading && coords && hasMapsKey ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="planner-card p-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <RecommendationFeed
            places={sortedExplorePlaces}
            suggestedIds={[]}
            emptyMessage="No Google results for these filters. Allow location, check your Maps key and Places API, or widen distance / change category."
          />
        )}
      </section>
    </div>
  );
}
