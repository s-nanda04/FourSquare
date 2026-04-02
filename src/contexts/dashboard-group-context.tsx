"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  fetchGroupMembersForDashboard,
  loadDashboardStatsFromSupabase,
  statsFromApiResponse,
} from "@/lib/dashboard-data";
import { fetchGroupDashboard, resolveGroupId } from "@/lib/discover-api";
import type { DashboardMember, DashboardStats } from "@/types/dashboard";

type DashboardGroupState =
  | { status: "loading" }
  | { status: "no-group" }
  | {
      status: "ready";
      groupId: string;
      members: DashboardMember[];
      stats: DashboardStats;
    };

const DashboardGroupContext = createContext<DashboardGroupState | null>(null);

export function DashboardGroupProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DashboardGroupState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const gid = await resolveGroupId();
    if (!gid) {
      setState({ status: "no-group" });
      return;
    }

    const members = await fetchGroupMembersForDashboard(gid);

    try {
      const api = await fetchGroupDashboard(gid);
      setState({
        status: "ready",
        groupId: gid,
        members,
        stats: statsFromApiResponse(api),
      });
    } catch {
      const stats = await loadDashboardStatsFromSupabase(gid);
      setState({
        status: "ready",
        groupId: gid,
        members,
        stats,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return <DashboardGroupContext.Provider value={state}>{children}</DashboardGroupContext.Provider>;
}

export function useDashboardGroup(): DashboardGroupState {
  const ctx = useContext(DashboardGroupContext);
  if (!ctx) {
    throw new Error("useDashboardGroup must be used within DashboardGroupProvider");
  }
  return ctx;
}
