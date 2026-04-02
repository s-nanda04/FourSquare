"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlannerEventItem } from "@/contexts/planner-events-context";

export function UpcomingEvents({
  events,
  onEdit,
  onDelete,
}: {
  events: PlannerEventItem[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-900">Your events</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-600">No events yet. Add one above.</p>
      ) : (
        <ul className="max-h-[min(40vh,24rem)] space-y-2 overflow-y-auto">
          {sorted.map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{event.title}</p>
                <p className="text-xs text-slate-500">{event.date}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-slate-600 hover:text-slate-900"
                  aria-label="Edit event"
                  onClick={() => onEdit(event.id)}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-slate-600 hover:text-red-700"
                  aria-label="Remove event"
                  onClick={() => {
                    if (typeof window !== "undefined" && window.confirm("Remove this event?")) {
                      onDelete(event.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
