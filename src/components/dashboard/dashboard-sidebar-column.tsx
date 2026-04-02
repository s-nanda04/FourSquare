"use client";

import { useDashboardGroup } from "@/contexts/dashboard-group-context";

export function DashboardSidebarColumn() {
  const state = useDashboardGroup();

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <div className="planner-card p-4">
          <h3 className="mb-3 font-semibold">Your Group</h3>
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
        <div className="planner-card p-4">
          <h3 className="font-semibold">Target Tracker</h3>
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (state.status === "no-group") {
    return (
      <div className="space-y-4">
        <div className="planner-card p-4">
          <h3 className="mb-3 font-semibold">Your Group</h3>
          <p className="text-sm text-slate-600">
            You’re not in a group yet. Create or join one from the Group tab to see members here.
          </p>
        </div>
        <div className="planner-card p-4">
          <h3 className="font-semibold">Target Tracker</h3>
          <p className="mt-2 text-sm text-slate-600">Join a group to track shared goals.</p>
        </div>
      </div>
    );
  }

  const { members, stats } = state;

  return (
    <div className="space-y-4">
      <div className="planner-card p-4">
        <h3 className="mb-3 font-semibold">Your Group</h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
            >
              <p className="text-sm font-medium">
                {member.name}
                {member.isYou ? " (you)" : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="planner-card p-4">
        <h3 className="font-semibold">Target Tracker</h3>
        <p className="mt-2 text-sm text-slate-600">{stats.target.description}</p>
        <p className="mt-2 font-semibold">
          Progress: {stats.target.progress} / {stats.target.goal}
        </p>
      </div>
    </div>
  );
}
