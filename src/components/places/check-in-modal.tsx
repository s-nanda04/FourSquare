"use client";

import { useState } from "react";
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

type NewCheckIn = {
  place: string;
  category: string;
  date: string;
};

export function CheckInModal({ onAdd }: { onAdd: (entry: NewCheckIn) => void }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");

  const handleSubmit = () => {
    if (!place.trim() || !date) return;
    onAdd({ place: place.trim(), category, date });
    setPlace("");
    setDate("");
    setCategory("Food");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        + Check In
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Check-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin-place">Place Name</Label>
            <Input
              id="checkin-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="text-slate-900"
            />
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
          <Button type="button" className="w-full" onClick={handleSubmit}>
            Save Check-in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
