"use client";

import { useState } from "react";
import { CheckInModal } from "@/components/places/check-in-modal";
import { PlaceTimeline } from "@/components/places/place-timeline";

export default function PlacesPage() {
  const [checkIns, setCheckIns] = useState([
    {
      id: 1,
      place: "Neptune Oyster",
      category: "Food",
      date: "2026-03-20",
      note: "Great seafood and quick service.",
    },
    {
      id: 2,
      place: "Boston Common",
      category: "Activities",
      date: "2026-03-18",
      note: "Sunset walk with the group.",
    },
    {
      id: 3,
      place: "ICA Boston",
      category: "Events",
      date: "2026-03-14",
      note: "Modern art exhibit was solid.",
    },
  ]);

  const addCheckIn = (entry: { place: string; category: string; date: string }) => {
    setCheckIns((current) => [
      { id: Date.now(), note: "Added from planner.", ...entry },
      ...current,
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Total Check-ins</p>
          <p className="text-2xl font-semibold">{checkIns.length}</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Favorite Category</p>
          <p className="text-2xl font-semibold">Food</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Top Neighborhood</p>
          <p className="text-2xl font-semibold">North End</p>
        </div>
      </div>
      <div className="flex justify-end">
        <CheckInModal onAdd={addCheckIn} />
      </div>
      <PlaceTimeline checkIns={checkIns} />
    </div>
  );
}
