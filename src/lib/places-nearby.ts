import { loadGoogleMapsApi } from "@/lib/maps";
import { haversineMiles } from "@/lib/geo";
import type { PlaceCardPlace } from "@/components/places/place-card";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80";

/** Maps Discover category → one or more Google Places `type` values for nearbySearch. */
function searchRequestsForCategory(
  category: string,
  center: google.maps.LatLng,
  radiusMeters: number,
): google.maps.places.PlaceSearchRequest[] {
  const base = { location: center, radius: radiusMeters };
  switch (category) {
    case "Food":
      return [{ ...base, type: "restaurant" }];
    case "Cafes":
      return [{ ...base, type: "cafe" }];
    case "Events":
      return [
        { ...base, type: "movie_theater" },
        { ...base, type: "stadium" },
        { ...base, type: "night_club" },
      ];
    case "Activities":
      return [
        { ...base, type: "park" },
        { ...base, type: "gym" },
        { ...base, type: "tourist_attraction" },
      ];
    default:
      return [{ ...base, type: "restaurant" }];
  }
}

function nearbySearchPromise(
  service: google.maps.places.PlacesService,
  request: google.maps.places.PlaceSearchRequest,
): Promise<google.maps.places.PlaceResult[]> {
  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Places nearbySearch: ${status}`));
      }
    });
  });
}

function placeToCard(
  r: google.maps.places.PlaceResult,
  userLat: number,
  userLng: number,
  categoryLabel: string,
): PlaceCardPlace | null {
  const loc = r.geometry?.location;
  if (!loc) return null;
  const plat = loc.lat();
  const plng = loc.lng();
  const mi = haversineMiles(userLat, userLng, plat, plng);
  let image = PLACEHOLDER_IMG;
  const photo = r.photos?.[0];
  if (photo?.getUrl) {
    try {
      image = photo.getUrl({ maxWidth: 800, maxHeight: 480 });
    } catch {
      /* keep placeholder */
    }
  }
  const pl = r.price_level;
  return {
    id: r.place_id ?? `${plat},${plng}`,
    name: r.name ?? "Place",
    category: categoryLabel,
    distance: `${mi.toFixed(1)} mi away`,
    image,
    subtitle: r.vicinity ?? r.formatted_address ?? undefined,
    rating: r.rating,
    priceLevel: pl != null ? Number(pl) : undefined,
  };
}

/**
 * Nearby places from Google Maps JavaScript Places library (enable Places API on your key).
 * Call only in the browser after loadGoogleMapsApi().
 */
export async function fetchNearbyPlacesForDiscover(
  userLat: number,
  userLng: number,
  radiusMiles: number,
  category: string,
): Promise<PlaceCardPlace[]> {
  await loadGoogleMapsApi();

  const radiusMeters = Math.min(
    50000,
    Math.max(100, Math.round(radiusMiles * 1609.34)),
  );
  const center = new google.maps.LatLng(userLat, userLng);

  const el = document.createElement("div");
  el.style.cssText = "position:absolute;width:1px;height:1px;left:-9999px;opacity:0;";
  document.body.appendChild(el);
  const map = new google.maps.Map(el, {
    center: { lat: userLat, lng: userLng },
    zoom: 14,
    disableDefaultUI: true,
  });
  const service = new google.maps.places.PlacesService(map);

  const requests = searchRequestsForCategory(category, center, radiusMeters);
  const categoryLabel =
    category === "Food"
      ? "Restaurant"
      : category === "Cafes"
        ? "Cafe"
        : category === "Events"
          ? "Event venue"
          : category === "Activities"
            ? "Activity"
            : "Place";

  try {
    const batches = await Promise.all(
      requests.map((req) => nearbySearchPromise(service, req)),
    );
    const byId = new Map<string, google.maps.places.PlaceResult>();
    for (const batch of batches) {
      for (const p of batch) {
        if (p.place_id && !byId.has(p.place_id)) {
          byId.set(p.place_id, p);
        }
      }
    }

    const merged = Array.from(byId.values()).filter((r) => r.geometry?.location);
    merged.sort((a, b) => {
      const da = haversineMiles(
        userLat,
        userLng,
        a.geometry!.location!.lat(),
        a.geometry!.location!.lng(),
      );
      const db = haversineMiles(
        userLat,
        userLng,
        b.geometry!.location!.lat(),
        b.geometry!.location!.lng(),
      );
      return da - db;
    });

    const cards: PlaceCardPlace[] = [];
    for (const r of merged.slice(0, 24)) {
      const card = placeToCard(r, userLat, userLng, categoryLabel);
      if (card) cards.push(card);
    }

    return cards.slice(0, 18);
  } finally {
    el.remove();
  }
}
