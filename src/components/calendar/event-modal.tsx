"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type EventInput = {
  place: string;
  time: string;
  note: string;
};

function formatSelectedLabel(isoDate: string) {
  try {
    return format(parseISO(isoDate), "MMM d, yyyy");
  } catch {
    return isoDate;
  }
}

export function EventModal({
  selectedDate,
  onAddEvent,
}: {
  selectedDate: string;
  onAddEvent: (date: string, event: EventInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!selectedDate || !place.trim() || !time) return;
    onAddEvent(selectedDate, { place: place.trim(), time, note });
    setPlace("");
    setTime("");
    setNote("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        Add Event
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add event — {formatSelectedLabel(selectedDate)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="event-place">Place</Label>
            <Input
              id="event-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-time">Time</Label>
            <Input
              id="event-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-note">Note</Label>
            <Textarea
              id="event-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-slate-900"
            />
          </div>
          <Button type="button" className="w-full" onClick={submit}>
            Save Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
