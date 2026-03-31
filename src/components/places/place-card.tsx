"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Place = {
  id: number;
  name: string;
  category: string;
  rating: number;
  distance: string;
  image: string;
};

export function PlaceCard({
  place,
  isSuggested,
  onSuggest,
}: {
  place: Place;
  isSuggested?: boolean;
  onSuggest?: () => void;
}) {
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
        <p className="text-sm text-slate-600">
          {place.rating} stars • {place.distance}
        </p>
        {onSuggest ? (
          <Button onClick={onSuggest} className="w-full">
            {isSuggested ? "✓ Suggested" : "Suggest to Group"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
