"use client";

import { PlaceCard } from "@/components/places/place-card";

type Place = {
  id: number;
  name: string;
  category: string;
  rating: number;
  distance: string;
  image: string;
};

export function RecommendationFeed({
  places,
  suggestedIds,
  onSuggest,
}: {
  places: Place[];
  suggestedIds: number[];
  onSuggest: (id: number) => void;
}) {
  if (places.length === 0) {
    return (
      <div className="planner-card p-8 text-center text-slate-600">
        No suggestions yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          isSuggested={suggestedIds.includes(place.id)}
          onSuggest={() => onSuggest(place.id)}
        />
      ))}
    </div>
  );
}
