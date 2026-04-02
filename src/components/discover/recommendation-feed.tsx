"use client";

import { PlaceCard, type PlaceCardPlace } from "@/components/places/place-card";

export function RecommendationFeed({
  places,
  suggestedIds,
  onSuggest,
  emptyMessage = "No suggestions yet. Try another category or add places to your Supabase database.",
}: {
  places: PlaceCardPlace[];
  suggestedIds: (string | number)[];
  onSuggest?: (id: string | number) => void;
  emptyMessage?: string;
}) {
  if (places.length === 0) {
    return (
      <div className="planner-card p-8 text-center text-slate-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {places.map((place) => (
        <PlaceCard
          key={String(place.id)}
          place={place}
          isSuggested={suggestedIds.map(String).includes(String(place.id))}
          onSuggest={onSuggest ? () => onSuggest(place.id) : undefined}
        />
      ))}
    </div>
  );
}
