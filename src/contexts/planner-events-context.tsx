"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { format } from "date-fns";

export type PlannerEventItem = { id: number; date: string; title: string };

const STORAGE_EVENTS = "foursquare-planner-events";
const STORAGE_READ = "foursquare-planner-events-read";

const DEFAULT_EVENTS: PlannerEventItem[] = [
  { id: 1, date: "2026-03-10", title: "Dinner @ Trattoria - 7:00 PM" },
  { id: 2, date: "2026-03-18", title: "Fenway Tour - 3:00 PM" },
  { id: 3, date: "2026-03-24", title: "Coffee Meetup - 10:30 AM" },
];

function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export function getUpcomingEvents(events: PlannerEventItem[]): PlannerEventItem[] {
  const t = todayKey();
  return [...events]
    .filter((e) => e.date >= t)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

type Ctx = {
  events: PlannerEventItem[];
  setEvents: React.Dispatch<React.SetStateAction<PlannerEventItem[]>>;
  readIds: Set<number>;
  markAllUpcomingRead: () => void;
  upcoming: PlannerEventItem[];
  unreadUpcomingCount: number;
};

const PlannerEventsContext = createContext<Ctx | null>(null);

export function PlannerEventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<PlannerEventItem[]>(DEFAULT_EVENTS);
  const [readIds, setReadIds] = useState<Set<number>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_EVENTS);
      if (raw) {
        const parsed = JSON.parse(raw) as PlannerEventItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
        }
      }
      const readRaw = localStorage.getItem(STORAGE_READ);
      if (readRaw) {
        const arr = JSON.parse(readRaw) as number[];
        if (Array.isArray(arr)) setReadIds(new Set(arr));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
    } catch {
      /* ignore */
    }
  }, [events, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_READ, JSON.stringify([...readIds]));
    } catch {
      /* ignore */
    }
  }, [readIds, hydrated]);

  const upcoming = useMemo(() => getUpcomingEvents(events), [events]);

  const unreadUpcomingCount = useMemo(
    () => upcoming.filter((e) => !readIds.has(e.id)).length,
    [upcoming, readIds],
  );

  const markAllUpcomingRead = useCallback(() => {
    const ups = getUpcomingEvents(events);
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const e of ups) next.add(e.id);
      return next;
    });
  }, [events]);

  const value = useMemo(
    () => ({
      events,
      setEvents,
      readIds,
      markAllUpcomingRead,
      upcoming,
      unreadUpcomingCount,
    }),
    [events, readIds, markAllUpcomingRead, upcoming, unreadUpcomingCount],
  );

  return (
    <PlannerEventsContext.Provider value={value}>{children}</PlannerEventsContext.Provider>
  );
}

export function usePlannerEvents() {
  const ctx = useContext(PlannerEventsContext);
  if (!ctx) {
    throw new Error("usePlannerEvents must be used within PlannerEventsProvider");
  }
  return ctx;
}
