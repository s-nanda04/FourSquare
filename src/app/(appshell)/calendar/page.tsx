"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EventEditDialog } from "@/components/calendar/event-edit-dialog";
import { EventModal } from "@/components/calendar/event-modal";
import { UpcomingEvents } from "@/components/calendar/upcoming-events";
import {
  usePlannerEvents,
  type PlannerEventItem,
} from "@/contexts/planner-events-context";

type EventItem = { id: number; date: string; title: string };

export default function CalendarPage() {
  const { events, setEvents } = usePlannerEvents();
  /** Avoid `new Date()` in useState initializers — SSR (Node TZ) vs browser TZ can differ and break hydration. */
  const [cursorMonth, setCursorMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const now = new Date();
    setSelectedDate(format(now, "yyyy-MM-dd"));
    setCursorMonth(startOfMonth(now));
  }, []);

  const eventsByDate = useMemo(() => {
    const m: Record<string, PlannerEventItem[]> = {};
    for (const event of events) {
      if (!m[event.date]) m[event.date] = [];
      m[event.date].push(event);
    }
    for (const k of Object.keys(m)) {
      m[k].sort((a, b) => a.id - b.id);
    }
    return m;
  }, [events]);

  const editingEvent = useMemo(
    () => (editingId != null ? events.find((e) => e.id === editingId) ?? null : null),
    [editingId, events],
  );

  const addEvent = (date: string, event: { place: string; time: string }) => {
    setEvents((current: EventItem[]) => [
      ...current,
      { id: Date.now(), date, title: `${event.place} - ${event.time}` },
    ]);
  };

  const openEdit = (id: number) => {
    setEditingId(id);
    setEditOpen(true);
  };

  const saveEdit = (payload: { id: number; date: string; title: string }) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === payload.id ? { ...e, date: payload.date, title: payload.title } : e,
      ),
    );
  };

  const deleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditOpen(false);
    }
  };

  if (selectedDate == null || cursorMonth == null) {
    return (
      <div className="flex min-h-[calc(100dvh-6rem)] flex-col gap-4">
        <div className="h-9 w-28 animate-pulse rounded-md bg-slate-200" />
        <div className="min-h-[min(28rem,60vh)] flex-1 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <EventModal selectedDate={selectedDate} onAddEvent={addEvent} />
      </div>

      <div className="min-h-0 w-full flex-1">
        <CalendarGrid
          month={cursorMonth}
          onMonthChange={setCursorMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventsByDate={eventsByDate}
          onEditEvent={openEdit}
          onDeleteEvent={deleteEvent}
        />
      </div>

      <UpcomingEvents events={events} onEdit={openEdit} onDelete={deleteEvent} />

      <EventEditDialog
        event={editingEvent}
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditingId(null);
        }}
        onSave={saveEdit}
        onDelete={deleteEvent}
      />
    </div>
  );
}
