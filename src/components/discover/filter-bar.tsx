"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect, SelectItem } from "@/components/ui/select";
import type { DiscoverSortKey } from "@/lib/discover-sort";

const categories = ["Food", "Events", "Activities", "Cafes"];

const SORT_OPTIONS: { value: DiscoverSortKey; label: string }[] = [
  { value: "distance", label: "Distance (nearest first)" },
  { value: "price_low", label: "Price (low to high)" },
  { value: "price_high", label: "Price (high to low)" },
  { value: "stars_low", label: "Stars (low to high)" },
  { value: "stars_high", label: "Stars (high to low)" },
];

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  distance,
  onDistanceChange,
  sortBy,
  onSortChange,
  distanceSubtext,
  onRetryLocation,
  locationStatus,
}: {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  distance: number;
  onDistanceChange: (value: number) => void;
  sortBy: DiscoverSortKey;
  onSortChange: (value: DiscoverSortKey) => void;
  /** Explains how distance is applied (e.g. from GPS). */
  distanceSubtext?: string;
  onRetryLocation?: () => void;
  locationStatus?: "loading" | "ok" | "denied" | "error" | "unsupported";
}) {
  const handleSliderChange = (value: number | readonly number[]) => {
    if (typeof value === "number") {
      onDistanceChange(value);
      return;
    }

    onDistanceChange(value[0] ?? 1);
  };

  return (
    <div className="planner-card space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`rounded-full px-3 py-1 text-sm ${
              selectedCategory === category
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-900">Distance: {distance} miles</p>
            {distanceSubtext ? (
              <p className="text-xs text-slate-600">{distanceSubtext}</p>
            ) : null}
          </div>
          {locationStatus === "denied" || locationStatus === "error" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-slate-300 text-slate-900"
              onClick={() => onRetryLocation?.()}
            >
              Use my location
            </Button>
          ) : null}
        </div>
        <Slider
          value={[distance]}
          min={1}
          max={20}
          step={1}
          onValueChange={handleSliderChange}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-900">Sort by</Label>
        <NativeSelect
          value={sortBy}
          onValueChange={(v) => onSortChange(v as DiscoverSortKey)}
          className="border-slate-300 bg-white text-slate-900"
        >
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
