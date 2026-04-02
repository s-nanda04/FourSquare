import { createClient } from "@/lib/supabase/client";
import type { DashboardMember, DashboardStats, GroupDashboardApiResponse } from "@/types/dashboard";

function normalizeTopVoted(raw: string | undefined): string | null {
  if (!raw || raw.trim() === "" || raw === "None") return null;
  return raw;
}

export async function fetchGroupMembersForDashboard(groupId: string): Promise<DashboardMember[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: gm } = await supabase.from("group_members").select("user_id, role").eq("group_id", groupId);
  const userIds = gm?.map((m) => m.user_id) ?? [];
  const { data: profs } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
      : { data: [] as { id: string; display_name: string | null }[] };

  const pmap = new Map((profs ?? []).map((p) => [p.id, p.display_name]));

  const rows: DashboardMember[] = (gm ?? []).map((m) => ({
    id: m.user_id,
    name: pmap.get(m.user_id)?.trim() || `Member ${m.user_id.slice(0, 8)}`,
    isYou: m.user_id === user?.id,
  }));

  rows.sort((a, b) => {
    if (a.isYou) return -1;
    if (b.isYou) return 1;
    return a.name.localeCompare(b.name);
  });

  return rows;
}

/** Aggregate check-ins, top vote, and target when the partner API is offline. */
export async function loadDashboardStatsFromSupabase(groupId: string): Promise<DashboardStats> {
  const supabase = createClient();

  const { count: visitCount, error: visitErr } = await supabase
    .from("visits")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId);

  const recentCheckins = visitErr ? null : (visitCount ?? 0);

  const { data: voteRows, error: voteErr } = await supabase
    .from("votes")
    .select("place_id, value, places(name)")
    .eq("group_id", groupId);

  let topVotedPlace: string | null = null;
  if (!voteErr && voteRows && voteRows.length > 0) {
    const scores = new Map<string, number>();
    const names = new Map<string, string>();
    for (const row of voteRows) {
      const pid = row.place_id as string;
      const v = row.value as number;
      scores.set(pid, (scores.get(pid) ?? 0) + v);
      const raw = row.places as { name: string } | { name: string }[] | null | undefined;
      const placeName = Array.isArray(raw) ? raw[0]?.name : raw?.name;
      if (placeName) names.set(pid, placeName);
    }
    let bestId: string | null = null;
    let bestScore = -Infinity;
    for (const [pid, s] of scores) {
      if (s > bestScore) {
        bestScore = s;
        bestId = pid;
      }
    }
    if (bestId != null) {
      topVotedPlace = names.get(bestId) ?? null;
    }
  }

  const progress = typeof recentCheckins === "number" ? Math.min(recentCheckins, 3) : 0;
  const goal = 3;

  return {
    recentCheckins,
    topVotedPlace,
    target: {
      description: "Weekend challenge: 3 group check-ins.",
      goal,
      progress,
    },
  };
}

export function statsFromApiResponse(api: GroupDashboardApiResponse): DashboardStats {
  return {
    recentCheckins: api.recent_checkins,
    topVotedPlace: normalizeTopVoted(api.top_voted_place),
    target: api.target,
  };
}
