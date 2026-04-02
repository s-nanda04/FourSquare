import type { PlaceCardPlace } from "@/components/places/place-card";

export type DiscoverSortKey =
  | "distance"
  | "price_low"
  | "price_high"
  | "stars_low"
  | "stars_high";

/** Parse leading "12.3 mi" from card distance copy. */
export function parseMilesFromPlaceCard(place: PlaceCardPlace): number {
  const s = String(place.distance ?? "");
  const m = s.match(/^([\d.]+)\s*mi/);
  if (m) return parseFloat(m[1]);
  return Number.POSITIVE_INFINITY;
}

export function sortDiscoverPlaces(
  places: PlaceCardPlace[],
  sort: DiscoverSortKey,
): PlaceCardPlace[] {
  const copy = [...places];
  switch (sort) {
    case "distance":
      return copy.sort(
        (a, b) => parseMilesFromPlaceCard(a) - parseMilesFromPlaceCard(b),
      );
    case "price_low":
      return copy.sort((a, b) => {
        const pa = a.priceLevel ?? 999;
        const pb = b.priceLevel ?? 999;
        return pa - pb;
      });
    case "price_high":
      return copy.sort((a, b) => {
        const pa = a.priceLevel ?? -1;
        const pb = b.priceLevel ?? -1;
        return pb - pa;
      });
    case "stars_low":
      return copy.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    case "stars_high":
      return copy.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    default:
      return copy;
  }
}
