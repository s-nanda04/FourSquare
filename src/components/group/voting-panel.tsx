"use client";

import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

type VotePlace = {
  id: number;
  name: string;
  votes: number;
};

export function VotingPanel({
  places,
  onVote,
}: {
  places: VotePlace[];
  onVote: (id: number, direction: "up" | "down") => void;
}) {
  const topVote = Math.max(...places.map((place) => place.votes));

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Voting Panel</h3>
      <div className="space-y-3">
        {places.map((place) => (
          <div
            key={place.id}
            className={`rounded-lg border p-3 ${
              place.votes === topVote
                ? "border-amber-400 bg-amber-50"
                : "border-slate-200"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">{place.name}</p>
              {place.votes === topVote ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                  <Trophy size={14} />
                  Leading
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onVote(place.id, "down")}>
                -
              </Button>
              <span className="text-sm font-semibold">{place.votes}</span>
              <Button size="sm" onClick={() => onVote(place.id, "up")}>
                +
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
