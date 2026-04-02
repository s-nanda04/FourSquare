"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckInModal } from "@/components/places/check-in-modal";
import { GroupSetupPanel } from "@/components/discover/group-setup-panel";
import { PlaceTimeline } from "@/components/places/place-timeline";
import { useMyPlaces } from "@/contexts/my-places-context";
import { resolveGroupId } from "@/lib/discover-api";

export default function PlacesPage() {
  const { checkIns, addCheckIn } = useMyPlaces();

  const [groupReady, setGroupReady] = useState(false);
  const [hasGroup, setHasGroup] = useState(false);

  const refreshGroup = useCallback(async () => {
    const gid = await resolveGroupId();
    setHasGroup(Boolean(gid));
    setGroupReady(true);
  }, []);

  useEffect(() => {
    void refreshGroup();
  }, [refreshGroup]);

  return (
    <div className="space-y-4">
      {!groupReady ? (
        <div className="planner-card h-40 animate-pulse bg-slate-100 p-4" />
      ) : hasGroup ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          You’re in a group — use <strong>Discover</strong> for group recommendations and voting.
        </div>
      ) : (
        <GroupSetupPanel onChanged={() => void refreshGroup()} />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Total Check-ins</p>
          <p className="text-2xl font-semibold">{checkIns.length}</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Favorite Category</p>
          <p className="text-2xl font-semibold">Food</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Top Neighborhood</p>
          <p className="text-2xl font-semibold">North End</p>
        </div>
      </div>
      <div className="flex justify-end">
        <CheckInModal onAdd={addCheckIn} />
      </div>
      <PlaceTimeline checkIns={checkIns} />
    </div>
  );
}
