"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlannerEventItem } from "@/contexts/planner-events-context";

function formatHeader(isoDate: string) {
  try {
    return format(parseISO(isoDate), "MMM d, yyyy");
  } catch {
    return isoDate;
  }
}

export function EventEditDialog({
  event,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  event: PlannerEventItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { id: number; date: string; title: string }) => void;
  onDelete: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (event && open) {
      setTitle(event.title);
      setDate(event.date);
    }
  }, [event, open]);

  const save = () => {
    if (!event || !title.trim() || !date) return;
    onSave({ id: event.id, date, title: title.trim() });
    onOpenChange(false);
  };

  const del = () => {
    if (!event) return;
    if (typeof window !== "undefined" && !window.confirm("Remove this event?")) return;
    onDelete(event.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit event — {event ? formatHeader(date) : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="edit-event-title">Title</Label>
            <Input
              id="edit-event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What’s happening?"
              className="text-slate-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-event-date">Date</Label>
            <Input
              id="edit-event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-slate-900"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={del}>
              Remove
            </Button>
            <Button type="button" className="sm:ml-auto" onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
