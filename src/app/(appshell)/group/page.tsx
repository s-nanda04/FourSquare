"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteModal } from "@/components/group/invite-modal";
import { MemberList } from "@/components/group/member-list";
import { VotingPanel } from "@/components/group/voting-panel";
import { useUser } from "@/hooks/use-user";

const GROUP_CODE = "BOS-PLANS-24";

const otherMembers = [
  { id: 2, name: "Noah Kim", role: "Member" as const, online: true },
  { id: 3, name: "Ava Chen", role: "Member" as const, online: false },
  { id: 4, name: "Ethan Lee", role: "Member" as const, online: true },
];

export default function GroupPage() {
  const { displayName } = useUser();
  const [copiedCode, setCopiedCode] = useState(false);

  const members = useMemo(() => {
    const you = displayName ?? "You";
    return [
      { id: 1, name: you, role: "Admin" as const, online: true, isYou: true as const },
      ...otherMembers,
    ];
  }, [displayName]);

  const [voting, setVoting] = useState(() => ({
    places: [
      { id: 1, name: "Neptune Oyster", votes: 6 },
      { id: 2, name: "Boston Public Garden", votes: 5 },
      { id: 3, name: "Tatte Bakery", votes: 4 },
      { id: 4, name: "Fenway Park Tour", votes: 3 },
    ],
    /** Current member may vote for at most one place at a time. */
    myVotePlaceId: null as number | null,
  }));

  const onVote = (id: number, direction: "up" | "down") => {
    setVoting((prev) => {
      const nextPlaces = prev.places.map((p) => ({ ...p }));
      const my = prev.myVotePlaceId;

      if (direction === "down") {
        if (my !== id) return prev;
        const idx = nextPlaces.findIndex((p) => p.id === id);
        if (idx >= 0) nextPlaces[idx].votes = Math.max(0, nextPlaces[idx].votes - 1);
        return { places: nextPlaces, myVotePlaceId: null };
      }

      if (my === id) return prev;

      if (my !== null) {
        const oldIdx = nextPlaces.findIndex((p) => p.id === my);
        if (oldIdx >= 0) nextPlaces[oldIdx].votes = Math.max(0, nextPlaces[oldIdx].votes - 1);
      }
      const newIdx = nextPlaces.findIndex((p) => p.id === id);
      if (newIdx >= 0) nextPlaces[newIdx].votes += 1;
      return { places: nextPlaces, myVotePlaceId: id };
    });
  };

  async function copyGroupCode() {
    try {
      await navigator.clipboard.writeText(GROUP_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div className="planner-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-slate-500">Group Code</p>
          <p className="text-lg font-semibold">{GROUP_CODE}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            onClick={copyGroupCode}
          >
            <Copy size={16} className="shrink-0" />
            {copiedCode ? "Copied!" : "Copy"}
          </Button>
          <InviteModal />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MemberList members={members} />
        <VotingPanel
          places={voting.places}
          myVotePlaceId={voting.myVotePlaceId}
          onVote={onVote}
        />
      </div>
    </div>
  );
}
