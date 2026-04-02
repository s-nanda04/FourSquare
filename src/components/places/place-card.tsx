"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type PlaceCardPlace = {
  id: string | number;
  name: string;
  category: string;
  /** Optional star rating (e.g. 4.5). */
  rating?: number;
  /** Google Places price_level 0–4 (Free … $$$$). */
  priceLevel?: number;
  /** Short line for distance or address. */
  distance?: string;
  image: string;
  /** Extra line under title (e.g. formatted address). */
  subtitle?: string;
};

export function PlaceCard({
  place,
  isSuggested,
  onSuggest,
}: {
  place: PlaceCardPlace;
  isSuggested?: boolean;
  onSuggest?: () => void;
}) {
  const priceLabel =
    place.priceLevel != null && place.priceLevel >= 0 && place.priceLevel <= 4
      ? ["Free", "$", "$$", "$$$", "$$$$"][place.priceLevel]
      : null;
  const detailLine = [
    place.rating != null ? `${place.rating.toFixed(1)}★` : null,
    priceLabel,
    place.distance,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="planner-card overflow-hidden">
      <Image
        src={place.image}
        alt={place.name}
        width={400}
        height={200}
        loading="eager"
        className="h-36 w-full object-cover"
      />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold">{place.name}</h3>
          <Badge variant="secondary">{place.category}</Badge>
        </div>
        {place.subtitle ? (
          <p className="text-xs text-slate-500 line-clamp-2">{place.subtitle}</p>
        ) : null}
        <p className="text-sm text-slate-600">
          {detailLine || "—"}
        </p>
        {onSuggest ? (
          <Button type="button" onClick={onSuggest} className="w-full" disabled={isSuggested}>
            {isSuggested ? "✓ Suggested to group" : "Suggest to Group"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
