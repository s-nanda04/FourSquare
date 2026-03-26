"use client";

import { useState } from "react";
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

export function EventModal({
  selectedDate,
  onAddEvent,
}: {
  selectedDate: string;
  onAddEvent: (date: string, event: EventInput) => void;
}) {
  const [place, setPlace] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!selectedDate || !place || !time) return;
    onAddEvent(selectedDate, { place, time, note });
    setPlace("");
    setTime("");
    setNote("");
  };

  return (
    <Dialog>
      <DialogTrigger className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
        Add Event
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event for {selectedDate || "date"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Place</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button className="w-full" onClick={submit}>
            Save Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
