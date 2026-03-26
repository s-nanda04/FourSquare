"use client";

import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

const categories = ["Food", "Events", "Activities", "Cafes"];

export function FilterBar({
  selectedCategory,
  onCategoryChange,
  distance,
  onDistanceChange,
  date,
  onDateChange,
}: {
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  distance: number;
  onDistanceChange: (value: number) => void;
  date: string;
  onDateChange: (value: string) => void;
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
        <p className="text-sm font-medium">Distance: {distance} miles</p>
        <Slider
          value={[distance]}
          min={1}
          max={20}
          step={1}
          onValueChange={handleSliderChange}
        />
      </div>
      <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
    </div>
  );
}
