"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteModal } from "@/components/group/invite-modal";
import { MemberList } from "@/components/group/member-list";
import { VotingPanel } from "@/components/group/voting-panel";

const members = [
  { id: 1, name: "Shreya Patel", role: "Admin" as const, online: true },
  { id: 2, name: "Noah Kim", role: "Member" as const, online: true },
  { id: 3, name: "Ava Chen", role: "Member" as const, online: false },
  { id: 4, name: "Ethan Lee", role: "Member" as const, online: true },
];

export default function GroupPage() {
  const [votePlaces, setVotePlaces] = useState([
    { id: 1, name: "Neptune Oyster", votes: 6 },
    { id: 2, name: "Boston Public Garden", votes: 5 },
    { id: 3, name: "Tatte Bakery", votes: 4 },
    { id: 4, name: "Fenway Park Tour", votes: 3 },
  ]);

  const onVote = (id: number, direction: "up" | "down") => {
    setVotePlaces((current) => {
      return current.map((place) => {
        if (place.id !== id) return place;

        if (direction === "up") {
          return { ...place, votes: place.votes + 1 };
        }

        return { ...place, votes: place.votes - 1 };
      });
    });
  };

  return (
    <div className="space-y-4">
      <div className="planner-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-slate-500">Group Code</p>
          <p className="text-lg font-semibold">BOS-PLANS-24</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Copy size={16} />
            Copy
          </Button>
          <InviteModal />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MemberList members={members} />
        <VotingPanel places={votePlaces} onVote={onVote} />
      </div>
    </div>
  );
}
