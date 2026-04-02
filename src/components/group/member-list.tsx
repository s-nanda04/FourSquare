"use client";

import { UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type MemberRow = {
  id: string;
  name: string;
  role: "Admin" | "Member";
  isYou?: boolean;
};

export function MemberList({
  members,
  isAdmin,
  soleAdmin,
  onRemoveMember,
  onLeaveGroup,
  actionBusyId,
}: {
  members: MemberRow[];
  isAdmin: boolean;
  /** You are the only admin — leave is blocked until someone else is admin or the group is deleted. */
  soleAdmin: boolean;
  onRemoveMember?: (userId: string) => void;
  onLeaveGroup?: () => void;
  actionBusyId?: string | null;
}) {
  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Members</h3>
      <p className="mb-3 text-xs text-slate-500">
        Admins can remove others; anyone can leave unless they are the only admin.
      </p>
      {soleAdmin ? (
        <p className="mb-3 text-xs text-amber-800">
          You’re the only admin — use Delete group below to leave and remove the group for everyone.
        </p>
      ) : null}
      <div className="space-y-3">
        {members.map((member) => {
          const busy = actionBusyId === member.id;
          const showRemove = isAdmin && onRemoveMember && !member.isYou;
          const showLeave = member.isYou && onLeaveGroup && !soleAdmin;

          return (
            <div key={member.id} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {(member.name.includes(" ")
                    ? member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                    : member.name.slice(0, 2)
                  ).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {member.isYou ? " (you)" : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{member.role}</Badge>
                {showRemove ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 border-red-200 px-2 text-red-700 hover:bg-red-50"
                    disabled={busy}
                    onClick={() => onRemoveMember(member.id)}
                  >
                    <UserMinus className="size-3.5 shrink-0" aria-hidden />
                    Remove
                  </Button>
                ) : null}
                {showLeave ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={busy}
                    onClick={() => onLeaveGroup()}
                  >
                    Leave
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
