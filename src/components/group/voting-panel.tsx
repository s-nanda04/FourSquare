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
  myVotePlaceId,
  onVote,
}: {
  places: VotePlace[];
  /** Which place the current member voted for, or null if they have not voted yet. */
  myVotePlaceId: number | null;
  onVote: (placeId: number, direction: "up" | "down") => void;
}) {
  const topVote = Math.max(...places.map((place) => place.votes), 0);

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Voting Panel</h3>
      <p className="mb-3 text-xs text-slate-500">
        You get one vote. Use + to pick a place (or move your vote). Use − on your pick to remove it.
      </p>
      <div className="space-y-3">
        {places.map((place) => {
          const isMyPick = myVotePlaceId === place.id;
          const canUp =
            !isMyPick; /* + adds or moves vote; disabled only when this row is already your vote */
          const canDown = isMyPick; /* − only removes your vote on this row */

          return (
            <div
              key={place.id}
              className={`rounded-lg border p-3 ${
                place.votes === topVote && topVote > 0
                  ? "border-amber-400 bg-amber-50"
                  : "border-slate-200"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">{place.name}</p>
                <div className="flex shrink-0 items-center gap-2">
                  {place.votes === topVote && topVote > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      <Trophy size={14} />
                      Leading
                    </span>
                  ) : null}
                  {isMyPick ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      Your vote
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canDown}
                  title={canDown ? "Remove your vote" : "Your vote is on another row"}
                  onClick={() => onVote(place.id, "down")}
                >
                  −
                </Button>
                <span className="text-sm font-semibold">{place.votes}</span>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canUp}
                  title={
                    canUp
                      ? myVotePlaceId === null
                        ? "Cast your vote"
                        : "Move your vote here"
                      : "You already voted for this place"
                  }
                  onClick={() => onVote(place.id, "up")}
                >
                  +
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
