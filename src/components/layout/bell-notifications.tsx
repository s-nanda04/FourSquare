"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Bell } from "lucide-react";
import { usePlannerEvents } from "@/contexts/planner-events-context";
import { cn } from "@/lib/utils";

function formatEventDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "EEE, MMM d");
  } catch {
    return dateStr;
  }
}

export function BellNotifications() {
  const { upcoming, readIds, unreadUpcomingCount, markAllUpcomingRead } = usePlannerEvents();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/15"
        aria-label="Upcoming event notifications"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {unreadUpcomingCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadUpcomingCount > 9 ? "9+" : unreadUpcomingCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[100] w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl"
          role="dialog"
          aria-label="Upcoming events"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
            <p className="text-sm font-semibold">Coming up</p>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
              onClick={() => {
                markAllUpcomingRead();
              }}
            >
              Read all
            </button>
          </div>
          <ul className="max-h-[min(60vh,20rem)] overflow-y-auto">
            {upcoming.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-slate-500">
                No upcoming events. Add some on the calendar.
              </li>
            ) : (
              upcoming.map((ev) => {
                const unread = !readIds.has(ev.id);
                return (
                  <li
                    key={ev.id}
                    className={cn(
                      "border-b border-slate-50 px-3 py-2.5 text-sm last:border-0",
                      unread && "bg-indigo-50/80",
                    )}
                  >
                    <p className="text-xs font-medium text-slate-500">
                      {formatEventDate(ev.date)}
                    </p>
                    <p className="font-medium text-slate-900">{ev.title}</p>
                  </li>
                );
              })
            )}
          </ul>
          <div className="border-t border-slate-100 px-3 py-2">
            <Link
              href="/calendar"
              className="block text-center text-xs font-medium text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View calendar
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
