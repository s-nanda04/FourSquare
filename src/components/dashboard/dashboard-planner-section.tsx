"use client";

import { useMemo } from "react";
import { endOfWeek, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { useDashboardGroup } from "@/contexts/dashboard-group-context";
import { usePlannerEvents } from "@/contexts/planner-events-context";

function countPlansThisWeek(events: { date: string }[]): number {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 0 });
  const end = endOfWeek(now, { weekStartsOn: 0 });
  return events.filter((e) => {
    const d = parseISO(e.date);
    return isWithinInterval(d, { start, end });
  }).length;
}

export function DashboardPlannerSection({ welcomeName }: { welcomeName: string }) {
  const { events } = usePlannerEvents();
  const upcomingThisWeek = useMemo(() => countPlansThisWeek(events), [events]);
  const groupState = useDashboardGroup();

  const membersLoading = groupState.status === "loading";
  const groupMemberCount =
    groupState.status === "ready" ? groupState.members.length : groupState.status === "no-group" ? 0 : null;
  const recentCheckins =
    groupState.status === "ready" ? groupState.stats.recentCheckins : null;
  const topVotedPlace =
    groupState.status === "ready" ? groupState.stats.topVotedPlace : null;

  return (
    <>
      <div className="planner-card p-4">
        <h3 className="text-lg font-semibold">Welcome back, {welcomeName}</h3>
        <p className="text-sm text-slate-600">
          {upcomingThisWeek === 0
            ? "No plans on your calendar this week — add one from the Calendar tab."
            : `You have ${upcomingThisWeek} upcoming ${upcomingThisWeek === 1 ? "plan" : "plans"} this week.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Upcoming Plans (this week)</p>
          <p className="text-2xl font-semibold">{upcomingThisWeek}</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Group members</p>
          <p className="text-2xl font-semibold">
            {membersLoading ? "…" : groupMemberCount === null ? "—" : groupMemberCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">People in your current group.</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Recent Check-ins</p>
          <p className="text-2xl font-semibold">
            {membersLoading ? "…" : recentCheckins === null ? "—" : recentCheckins}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total group check-ins recorded.</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Top Voted Place</p>
          <p className="text-xl font-semibold leading-snug">
            {membersLoading ? "…" : topVotedPlace ?? "—"}
          </p>
        </div>
      </div>
    </>
  );
}
