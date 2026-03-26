"use client";

import { useState } from "react";
import { FilterBar } from "@/components/discover/filter-bar";
import { RecommendationFeed } from "@/components/discover/recommendation-feed";
import { Skeleton } from "@/components/ui/skeleton";

const places = [
  {
    id: 1,
    name: "Neptune Oyster",
    category: "Food",
    rating: 4.8,
    distance: "1.2 mi",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    name: "Fenway Park Tour",
    category: "Events",
    rating: 4.6,
    distance: "2.5 mi",
    image:
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    name: "Boston Common Walk",
    category: "Activities",
    rating: 4.7,
    distance: "0.7 mi",
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 4,
    name: "Tatte Bakery",
    category: "Cafes",
    rating: 4.5,
    distance: "1.0 mi",
    image:
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 5,
    name: "Trillium Brewing",
    category: "Food",
    rating: 4.4,
    distance: "3.1 mi",
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 6,
    name: "ICA Boston",
    category: "Events",
    rating: 4.6,
    distance: "2.2 mi",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 7,
    name: "Charles River Kayak",
    category: "Activities",
    rating: 4.5,
    distance: "4.0 mi",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 8,
    name: "Render Coffee",
    category: "Cafes",
    rating: 4.3,
    distance: "2.8 mi",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
  },
];

export default function DiscoverPage() {
  const [category, setCategory] = useState("Food");
  const [distance, setDistance] = useState(10);
  const [date, setDate] = useState("");
  const [suggestedIds, setSuggestedIds] = useState<number[]>([]);
  const loading = false;
  const filteredPlaces = places.filter((place) => place.category === category);

  const handleSuggest = (id: number) => {
    if (suggestedIds.includes(id)) return;
    setSuggestedIds([...suggestedIds, id]);
  };

  return (
    <div className="space-y-4">
      <FilterBar
        selectedCategory={category}
        onCategoryChange={setCategory}
        distance={distance}
        onDistanceChange={setDistance}
        date={date}
        onDateChange={setDate}
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="planner-card p-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <RecommendationFeed
          places={filteredPlaces}
          suggestedIds={suggestedIds}
          onSuggest={handleSuggest}
        />
      )}
    </div>
  );
}
