"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  eventsByDate,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  eventsByDate: Record<string, string>;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmpty = monthStart.getDay();

  return (
    <div className="planner-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{format(month, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            aria-label="Previous month"
            onClick={() => onMonthChange(subMonths(month, 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            aria-label="Next month"
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: leadingEmpty }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[4.5rem]" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const hasEvent = Boolean(eventsByDate[dateKey]);
          let selected = false;
          try {
            selected = isSameDay(day, parseISO(selectedDate));
          } catch {
            selected = selectedDate === dateKey;
          }
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "flex min-h-[4.5rem] flex-col rounded-md border p-2 text-left text-sm text-slate-900 transition-colors",
                selected && "border-primary bg-indigo-50",
                !selected && "border-slate-200 hover:border-slate-300",
                hasEvent && "font-semibold",
              )}
            >
              <span>{format(day, "d")}</span>
              {hasEvent ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{eventsByDate[dateKey]}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
