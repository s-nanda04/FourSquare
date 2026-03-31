"use client";

import { useState } from "react";

const destinations = ["Neptune Oyster", "Fenway Park", "Boston Common", "Tatte Bakery"];

export function DirectionsPanel() {
  const [destination, setDestination] = useState("Neptune Oyster");

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Directions</h3>
      <select
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="h-8 w-full rounded-lg border border-gray-200 bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
      >
        {destinations.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <p className="mt-3 text-sm text-slate-600">ETA: 18 mins</p>
      <p className="text-sm text-slate-600">Steps: 2,350</p>
    </div>
  );
}
