"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type MemberRow = {
  id: number;
  name: string;
  role: "Admin" | "Member";
  online: boolean;
  isYou?: boolean;
};

function useTabActive() {
  return useSyncExternalStore(
    (onStoreChange) => {
      document.addEventListener("visibilitychange", onStoreChange);
      window.addEventListener("focus", onStoreChange);
      window.addEventListener("blur", onStoreChange);
      return () => {
        document.removeEventListener("visibilitychange", onStoreChange);
        window.removeEventListener("focus", onStoreChange);
        window.removeEventListener("blur", onStoreChange);
      };
    },
    () => typeof document !== "undefined" && document.visibilityState === "visible",
    () => true,
  );
}

function statusDot(member: MemberRow, tabActive: boolean) {
  if (member.isYou) {
    return tabActive ? "bg-emerald-500" : "bg-amber-400";
  }
  return member.online ? "bg-emerald-500" : "bg-slate-400";
}

function statusLabel(member: MemberRow, tabActive: boolean) {
  if (member.isYou) {
    return tabActive ? "Active in this tab" : "Away / tab in background";
  }
  return member.online ? "Online" : "Offline";
}

export function MemberList({ members }: { members: MemberRow[] }) {
  const tabActive = useTabActive();

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Members</h3>
      <p className="mb-3 text-xs text-slate-500">
        Your row reflects this browser tab (active vs away). Teammates are demo data until live presence ships.
      </p>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {member.name}
                  {member.isYou ? " (you)" : ""}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span
                    className={cn("inline-block h-2 w-2 rounded-full", statusDot(member, tabActive))}
                    aria-hidden
                  />
                  {statusLabel(member, tabActive)}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {member.role}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
