import { apiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { GroupDashboardApiResponse } from "@/types/dashboard";
import type { DiscoverResponse } from "@/types/discover";

/**
 * Resolves a group the signed-in user **actually belongs to** (via `group_members`).
 * `NEXT_PUBLIC_DEFAULT_GROUP_ID` only applies if that UUID is also a membership row — it does not bypass RLS.
 */
export async function resolveGroupId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const envId = process.env.NEXT_PUBLIC_DEFAULT_GROUP_ID?.trim();
  if (envId) {
    const { data: envRow } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", envId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (envRow?.group_id) return envRow.group_id;
  }

  const { data: rows } = await supabase.from("group_members").select("group_id").limit(1);
  return rows?.[0]?.group_id ?? null;
}

export async function fetchDiscover(groupId: string) {
  return apiFetch<DiscoverResponse>(`/discover/${encodeURIComponent(groupId)}`);
}

/** Partner API: live dashboard aggregates (check-ins, top vote, target) + member names. */
export async function fetchGroupDashboard(groupId: string) {
  return apiFetch<GroupDashboardApiResponse>(`/groups/${encodeURIComponent(groupId)}/dashboard`);
}

export async function voteForPlace(groupId: string, placeId: string, value: 1 | -1 = 1) {
  return apiFetch<{ vote_total: number }>("/places/vote", {
    method: "POST",
    body: JSON.stringify({ group_id: groupId, place_id: placeId, value }),
  });
}

/** Create a group in Supabase (no FastAPI). Trigger adds you as admin in group_members. */
export async function createGroup(name: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in. Sign in again, then retry.");

  const { data, error } = await supabase
    .from("groups")
    .insert({ name: name.trim(), created_by: user.id })
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Failed to create group.");
  return { group_id: data.id, name: data.name };
}

/** Join a group in Supabase (no FastAPI). Requires migration group_members_insert_self_member. */
export async function joinGroup(groupId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in. Sign in again, then retry.");

  const gid = groupId.trim();

  const { error } = await supabase.from("group_members").insert({
    group_id: gid,
    user_id: user.id,
    role: "member",
  });

  if (error) {
    if (error.code === "23503") {
      throw new Error("Group not found. Check the group ID.");
    }
    if (error.code === "23505") {
      return { message: "Already a member", group_id: gid };
    }
    throw new Error(error.message);
  }

  return { message: "Joined group", group_id: gid };
}
