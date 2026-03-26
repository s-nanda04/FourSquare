"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DirectionsPanel() {
  const [destination, setDestination] = useState("Neptune Oyster");

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Directions</h3>
      <Select
        value={destination}
        onValueChange={(value) => setDestination(value ?? "Neptune Oyster")}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Neptune Oyster">Neptune Oyster</SelectItem>
          <SelectItem value="Fenway Park">Fenway Park</SelectItem>
          <SelectItem value="Boston Common">Boston Common</SelectItem>
          <SelectItem value="Tatte Bakery">Tatte Bakery</SelectItem>
        </SelectContent>
      </Select>
      <p className="mt-3 text-sm text-slate-600">ETA: 18 mins</p>
      <p className="text-sm text-slate-600">Steps: 2,350</p>
    </div>
  );
}
