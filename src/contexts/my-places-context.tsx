"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type MyPlaceCheckIn = {
  id: number;
  place: string;
  category: string;
  date: string;
  note?: string;
};

const STORAGE = "foursquare-my-places";

const DEFAULT_CHECKINS: MyPlaceCheckIn[] = [
  {
    id: 1,
    place: "Neptune Oyster",
    category: "Food",
    date: "2026-03-20",
    note: "Great seafood and quick service.",
  },
  {
    id: 2,
    place: "Boston Common",
    category: "Activities",
    date: "2026-03-18",
    note: "Sunset walk with the group.",
  },
  {
    id: 3,
    place: "ICA Boston",
    category: "Events",
    date: "2026-03-14",
    note: "Modern art exhibit was solid.",
  },
];

type Ctx = {
  checkIns: MyPlaceCheckIn[];
  addCheckIn: (entry: Omit<MyPlaceCheckIn, "id" | "note"> & { note?: string }) => void;
};

const MyPlacesContext = createContext<Ctx | null>(null);

export function MyPlacesProvider({ children }: { children: React.ReactNode }) {
  const [checkIns, setCheckIns] = useState<MyPlaceCheckIn[]>(DEFAULT_CHECKINS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw) as MyPlaceCheckIn[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCheckIns(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(checkIns));
    } catch {
      /* ignore */
    }
  }, [checkIns, hydrated]);

  const addCheckIn = useCallback(
    (entry: Omit<MyPlaceCheckIn, "id" | "note"> & { note?: string }) => {
      setCheckIns((current) => [
        { id: Date.now(), note: entry.note ?? "Added from planner.", ...entry },
        ...current,
      ]);
    },
    [],
  );

  const value = useMemo(() => ({ checkIns, addCheckIn }), [checkIns, addCheckIn]);

  return <MyPlacesContext.Provider value={value}>{children}</MyPlacesContext.Provider>;
}

export function useMyPlaces() {
  const ctx = useContext(MyPlacesContext);
  if (!ctx) {
    throw new Error("useMyPlaces must be used within MyPlacesProvider");
  }
  return ctx;
}
