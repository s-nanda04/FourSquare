"use client";

import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
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
import type { PlannerEventItem } from "@/contexts/planner-events-context";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  eventsByDate,
  onEditEvent,
  onDeleteEvent,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  eventsByDate: Record<string, PlannerEventItem[]>;
  onEditEvent: (id: number) => void;
  onDeleteEvent: (id: number) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmpty = monthStart.getDay();

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{format(month, "MMMM yyyy")}</h3>
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

      <div className="mb-2 grid shrink-0 grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 auto-rows-[minmax(5.5rem,1fr)] gap-1.5 sm:gap-2 sm:auto-rows-[minmax(6.25rem,1fr)]">
        {Array.from({ length: leadingEmpty }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[5.5rem] rounded-md bg-slate-50/80 sm:min-h-[6.5rem]" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateKey] ?? [];
          const hasEvent = dayEvents.length > 0;
          let selected = false;
          try {
            selected = isSameDay(day, parseISO(selectedDate));
          } catch {
            selected = selectedDate === dateKey;
          }
          return (
            <div
              key={dateKey}
              className={cn(
                "flex min-h-[5.5rem] flex-col rounded-md border p-1.5 text-left text-slate-900 transition-colors sm:min-h-[6.5rem] sm:p-2",
                selected && "border-primary bg-indigo-50 ring-1 ring-primary/30",
                !selected && "border-slate-200 bg-white hover:border-slate-300",
                hasEvent && !selected && "border-slate-300",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDate(dateKey)}
                className="mb-0.5 w-full shrink-0 text-left text-sm font-medium text-slate-900"
              >
                {format(day, "d")}
              </button>
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="group flex items-start gap-0.5 rounded border border-transparent bg-slate-50/90 px-0.5 py-0.5 text-[10px] leading-tight text-slate-700 sm:text-[11px]"
                  >
                    <span className="line-clamp-3 min-w-0 flex-1">{ev.title}</span>
                    <span className="flex shrink-0 gap-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded p-0.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        aria-label="Edit event"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(ev.id);
                        }}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        className="rounded p-0.5 text-slate-600 hover:bg-red-100 hover:text-red-700"
                        aria-label="Remove event"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof window !== "undefined" && window.confirm("Remove this event?")) {
                            onDeleteEvent(ev.id);
                          }
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
