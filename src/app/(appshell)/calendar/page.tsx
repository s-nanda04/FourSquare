"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { EventModal } from "@/components/calendar/event-modal";
import { UpcomingEvents } from "@/components/calendar/upcoming-events";

type EventItem = { id: number; date: string; title: string };

function downloadIcs(events: EventItem[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FourSquare//Planner//EN",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((ev) => {
      const d = ev.date.replaceAll("-", "");
      return [
        "BEGIN:VEVENT",
        `UID:${ev.id}@foursquare.app`,
        `DTSTAMP:${d}T120000Z`,
        `DTSTART;VALUE=DATE:${d}`,
        `SUMMARY:${ev.title.replace(/,/g, "\\,")}`,
        "END:VEVENT",
      ];
    }),
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "foursquare-plans.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CalendarPage() {
  const [cursorMonth, setCursorMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, date: "2026-03-10", title: "Dinner @ Trattoria - 7:00 PM" },
    { id: 2, date: "2026-03-18", title: "Fenway Tour - 3:00 PM" },
    { id: 3, date: "2026-03-24", title: "Coffee Meetup - 10:30 AM" },
  ]);

  const eventMap: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    for (const event of events) {
      m[event.date] = event.title;
    }
    return m;
  }, [events]);

  const addEvent = (date: string, event: { place: string; time: string }) => {
    setEvents((current) => [
      ...current,
      { id: Date.now(), date, title: `${event.place} - ${event.time}` },
    ]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <EventModal selectedDate={selectedDate} onAddEvent={addEvent} />
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            onClick={() => downloadIcs(events)}
          >
            Export .ics
          </Button>
        </div>
        <CalendarGrid
          month={cursorMonth}
          onMonthChange={setCursorMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          eventsByDate={eventMap}
        />
      </div>
      <UpcomingEvents events={events} />
    </div>
  );
}
