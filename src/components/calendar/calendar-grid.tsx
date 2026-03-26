"use client";

import { cn } from "@/lib/utils";

export function CalendarGrid({
  selectedDate,
  onSelectDate,
  eventsByDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  eventsByDate: Record<string, string>;
}) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">March 2026</h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dateKey = `2026-03-${String(day).padStart(2, "0")}`;
          const hasEvent = Boolean(eventsByDate[dateKey]);
          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "rounded-md border p-2 text-left text-sm",
                selectedDate === dateKey && "border-primary bg-indigo-50",
                hasEvent && "font-semibold"
              )}
            >
              <p>{day}</p>
              {hasEvent ? <p className="truncate text-xs text-slate-500">{eventsByDate[dateKey]}</p> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
