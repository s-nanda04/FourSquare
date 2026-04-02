"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMyPlaces } from "@/contexts/my-places-context";
import { usePlannerEvents } from "@/contexts/planner-events-context";
import { routeQueryFromTitle } from "@/lib/route-planner";

type NewCheckIn = {
  place: string;
  category: string;
  date: string;
};

const OTHER_VALUE = "__other__";

function uniquePlacesByName(
  checkIns: { id: number; place: string; category: string }[],
): { id: number; place: string; category: string }[] {
  const seen = new Set<string>();
  const out: { id: number; place: string; category: string }[] = [];
  for (const c of checkIns) {
    const k = c.place.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out.sort((a, b) => a.place.localeCompare(b.place));
}

export function CheckInModal({ onAdd }: { onAdd: (entry: NewCheckIn) => void }) {
  const { events } = usePlannerEvents();
  const { checkIns } = useMyPlaces();

  const savedOptions = useMemo(() => uniquePlacesByName(checkIns), [checkIns]);

  const [open, setOpen] = useState(false);
  const [placeKey, setPlaceKey] = useState("");
  const [customPlace, setCustomPlace] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");

  const resetForm = () => {
    setPlaceKey("");
    setCustomPlace("");
    setCategory("Food");
    setDate("");
  };

  const resolvePlace = (): string | null => {
    if (!placeKey) return null;
    if (placeKey === OTHER_VALUE) {
      const t = customPlace.trim();
      return t || null;
    }
    if (placeKey.startsWith("plan:")) {
      const id = Number(placeKey.slice(5));
      const ev = events.find((e) => e.id === id);
      if (!ev) return null;
      const q = routeQueryFromTitle(ev.title);
      return q || null;
    }
    if (placeKey.startsWith("saved:")) {
      const id = Number(placeKey.slice(6));
      const c = checkIns.find((x) => x.id === id);
      return c?.place.trim() ?? null;
    }
    return null;
  };

  const handlePlaceSelect = (value: string) => {
    setPlaceKey(value);
    if (value.startsWith("saved:")) {
      const id = Number(value.slice(6));
      const c = checkIns.find((x) => x.id === id);
      if (c) setCategory(c.category);
    }
  };

  const handleSubmit = () => {
    const place = resolvePlace();
    if (!place || !date) return;
    onAdd({ place, category, date });
    resetForm();
    setOpen(false);
  };

  const showOther = placeKey === OTHER_VALUE;
  const canSubmit = Boolean(resolvePlace() && date);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        + Check In
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Check-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin-place">Place</Label>
            <select
              id="checkin-place"
              value={placeKey}
              onChange={(e) => handlePlaceSelect(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-[#fa4779] focus:ring-1 focus:ring-[#fa4779]"
            >
              <option value="">Select a place…</option>
              {events.length > 0 ? (
                <optgroup label="Calendar plans">
                  {events.map((e) => (
                    <option key={e.id} value={`plan:${e.id}`}>
                      {e.title}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {savedOptions.length > 0 ? (
                <optgroup label="My places">
                  {savedOptions.map((c) => (
                    <option key={c.id} value={`saved:${c.id}`}>
                      {c.place}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <option value={OTHER_VALUE}>Other (type name)…</option>
            </select>
            <p className="text-xs text-slate-500">
              Pick from your calendar or places you’ve checked in before, or choose Other to enter a new name.
            </p>
            {showOther ? (
              <Input
                id="checkin-place-custom"
                value={customPlace}
                onChange={(e) => setCustomPlace(e.target.value)}
                placeholder="Place name"
                className="text-slate-900"
                autoComplete="off"
              />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-category">Category</Label>
            <select
              id="checkin-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-[#fa4779] focus:ring-1 focus:ring-[#fa4779]"
            >
              <option value="Food">Food</option>
              <option value="Events">Events</option>
              <option value="Activities">Activities</option>
              <option value="Cafes">Cafes</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkin-date">Date</Label>
            <Input
              id="checkin-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-slate-900"
            />
          </div>
          <Button type="button" className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            Save Check-in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
