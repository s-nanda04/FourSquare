"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
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
import { PlaceSuggestions } from "@/components/calendar/place-suggestions";

type EventInput = {
  place: string;
  time: string;
};

export function EventModal({
  selectedDate,
  onAddEvent,
}: {
  selectedDate: string;
  onAddEvent: (date: string, event: EventInput) => void;
}) {
  const [open, setOpen] = useState(false);
  /** Date for the new event — defaults to the selected calendar day; change to book any day. */
  const [eventDate, setEventDate] = useState(selectedDate);
  const [place, setPlace] = useState("");
  const [time, setTime] = useState("");
  const [mapsUrl, setMapsUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open) setEventDate(selectedDate);
  }, [open, selectedDate]);

  const submit = () => {
    if (!eventDate || !place.trim() || !time) return;
    onAddEvent(eventDate, { place: place.trim(), time });
    setPlace("");
    setTime("");
    setMapsUrl(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        Add Event
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="text-slate-900"
            />
            <p className="text-xs text-slate-500">
              Defaults to the day you clicked on the calendar; pick another date for a future event.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-place">Place</Label>
            <Input
              id="event-place"
              value={place}
              onChange={(e) => {
                setPlace(e.target.value);
                setMapsUrl(null);
              }}
              placeholder="Type a restaurant name…"
              autoComplete="off"
              className="text-slate-900"
            />
            <PlaceSuggestions
              query={place}
              onPick={({ title, mapsUrl: url }) => {
                setPlace(title);
                setMapsUrl(url);
              }}
            />
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                <ExternalLink size={14} />
                Open in Google Maps
              </a>
            ) : null}
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
          <Button type="button" className="w-full" onClick={submit}>
            Save Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
