"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EventModal } from "@/components/calendar/event-modal";
import { UpcomingEvents } from "@/components/calendar/upcoming-events";

type EventItem = { id: number; date: string; title: string };

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState("2026-03-10");
  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, date: "2026-03-10", title: "Dinner @ Trattoria - 7:00 PM" },
    { id: 2, date: "2026-03-18", title: "Fenway Tour - 3:00 PM" },
    { id: 3, date: "2026-03-24", title: "Coffee Meetup - 10:30 AM" },
  ]);

  const eventMap: Record<string, string> = {};
  for (const event of events) {
    eventMap[event.date] = event.title;
  }

  const addEvent = (date: string, event: { place: string; time: string }) => {
    setEvents((current) => [
      ...current,
      { id: Date.now(), date, title: `${event.place} - ${event.time}` },
    ]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <EventModal selectedDate={selectedDate} onAddEvent={addEvent} />
          <Button variant="outline">Export .ics</Button>
        </div>
        <CalendarGrid
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventsByDate={eventMap}
        />
      </div>
      <UpcomingEvents events={events} />
    </div>
  );
}
