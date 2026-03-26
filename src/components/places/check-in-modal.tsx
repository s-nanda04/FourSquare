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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type NewCheckIn = {
  place: string;
  category: string;
  date: string;
};

export function CheckInModal({ onAdd }: { onAdd: (entry: NewCheckIn) => void }) {
  const [place, setPlace] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");

  const handleSubmit = () => {
    if (!place || !date) return;
    onAdd({ place, category, date });
    setPlace("");
    setDate("");
    setCategory("Food");
  };

  return (
    <Dialog>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        + Check In
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Check-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Place Name</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value ?? "Food")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Events">Events</SelectItem>
                <SelectItem value="Activities">Activities</SelectItem>
                <SelectItem value="Cafes">Cafes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleSubmit}>
            Save Check-in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
