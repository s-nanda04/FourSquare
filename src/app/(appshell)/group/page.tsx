"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InviteModal } from "@/components/group/invite-modal";
import { MemberList, type MemberRow } from "@/components/group/member-list";
import { VotingPanel, type VotePlace } from "@/components/group/voting-panel";
import { useUser } from "@/hooks/use-user";
import { resolveGroupId } from "@/lib/discover-api";
import { createClient } from "@/lib/supabase/client";

/** Local-only demo places for pitches (not persisted). */
const DEMO_VOTE_PLACES: VotePlace[] = [
  { id: "demo-1", name: "Neptune Oyster", votes: 6 },
  { id: "demo-2", name: "Boston Public Garden", votes: 5 },
  { id: "demo-3", name: "Tatte Bakery", votes: 4 },
  { id: "demo-4", name: "Fenway Park Tour", votes: 3 },
];

export default function GroupPage() {
  const router = useRouter();
  const { user } = useUser();
  const [copiedCode, setCopiedCode] = useState(false);
  const [groupMeta, setGroupMeta] = useState<{ id: string; name: string } | null>(null);
  const [groupResolved, setGroupResolved] = useState(false);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [demoVoting, setDemoVoting] = useState(() => ({
    places: DEMO_VOTE_PLACES.map((p) => ({ ...p })),
    myVotePlaceId: null as string | null,
  }));
  const [memberActionId, setMemberActionId] = useState<string | null>(null);
  const [groupActionError, setGroupActionError] = useState<string | null>(null);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteGroupBusy, setDeleteGroupBusy] = useState(false);

  const isAdmin = useMemo(() => members.find((m) => m.isYou)?.role === "Admin", [members]);
  const adminCount = useMemo(() => members.filter((m) => m.role === "Admin").length, [members]);
  const soleAdmin = Boolean(isAdmin && adminCount === 1);

  const fetchDetailsRef = useRef<(gid: string) => Promise<void>>(async () => {});

  const fetchDetails = useCallback(async (gid: string) => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const { data: gm } = await supabase.from("group_members").select("user_id, role").eq("group_id", gid);
    const userIds = gm?.map((m) => m.user_id) ?? [];
    const { data: profs } =
      userIds.length > 0
        ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
        : { data: [] as { id: string; display_name: string | null }[] };

    const pmap = new Map((profs ?? []).map((p) => [p.id, p.display_name]));

    const rows: MemberRow[] = (gm ?? []).map((m) => ({
      id: m.user_id,
      name: pmap.get(m.user_id)?.trim() || `Member ${m.user_id.slice(0, 8)}`,
      role: m.role === "admin" ? "Admin" : "Member",
      isYou: m.user_id === authUser?.id,
    }));

    rows.sort((a, b) => {
      if (a.isYou) return -1;
      if (b.isYou) return 1;
      if (a.role !== b.role) return a.role === "Admin" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    setMembers(rows);
  }, []);

  useEffect(() => {
    fetchDetailsRef.current = fetchDetails;
  }, [fetchDetails]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const gid = await resolveGroupId();
      if (cancelled) return;

      if (!gid) {
        setGroupMeta(null);
        setMembers([]);
        setGroupResolved(true);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.from("groups").select("id, name").eq("id", gid).single();

      if (cancelled) return;

      if (error || !data) {
        setGroupMeta(null);
        setMembers([]);
        setGroupResolved(true);
        return;
      }

      setGroupMeta({ id: data.id, name: data.name });
      await fetchDetailsRef.current(gid);
      if (!cancelled) setGroupResolved(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onDemoVote = (placeId: string, direction: "up" | "down") => {
    setDemoVoting((prev) => {
      const nextPlaces = prev.places.map((p) => ({ ...p }));
      const my = prev.myVotePlaceId;

      if (direction === "down") {
        if (my !== placeId) return prev;
        const idx = nextPlaces.findIndex((p) => p.id === placeId);
        if (idx >= 0) nextPlaces[idx].votes = Math.max(0, nextPlaces[idx].votes - 1);
        return { places: nextPlaces, myVotePlaceId: null };
      }

      if (my === placeId) return prev;

      if (my !== null) {
        const oldIdx = nextPlaces.findIndex((p) => p.id === my);
        if (oldIdx >= 0) nextPlaces[oldIdx].votes = Math.max(0, nextPlaces[oldIdx].votes - 1);
      }
      const newIdx = nextPlaces.findIndex((p) => p.id === placeId);
      if (newIdx >= 0) nextPlaces[newIdx].votes += 1;
      return { places: nextPlaces, myVotePlaceId: placeId };
    });
  };

  async function copyGroupCode() {
    if (!groupMeta) return;
    try {
      await navigator.clipboard.writeText(groupMeta.id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!groupMeta || !user) return;
    if (!window.confirm("Remove this person from the group?")) return;
    setGroupActionError(null);
    setMemberActionId(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupMeta.id)
      .eq("user_id", userId);
    setMemberActionId(null);
    if (error) {
      setGroupActionError(error.message);
      return;
    }
    await fetchDetails(groupMeta.id);
  }

  async function handleLeaveGroup() {
    if (!groupMeta || !user) return;
    if (!window.confirm("Leave this group? You can rejoin with the group ID from My Places if you have it.")) return;
    setGroupActionError(null);
    setMemberActionId(user.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupMeta.id)
      .eq("user_id", user.id);
    setMemberActionId(null);
    if (error) {
      setGroupActionError(error.message);
      return;
    }
    setGroupMeta(null);
    setMembers([]);
    router.refresh();
  }

  async function handleDeleteGroup() {
    if (!groupMeta || !user) return;
    setDeleteGroupBusy(true);
    setGroupActionError(null);
    const supabase = createClient();
    const { error } = await supabase.from("groups").delete().eq("id", groupMeta.id);
    setDeleteGroupBusy(false);
    if (error) {
      setGroupActionError(error.message);
      return;
    }
    setDeleteGroupOpen(false);
    setGroupMeta(null);
    setMembers([]);
    router.push("/places");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!groupResolved ? (
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      ) : !groupMeta ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">You’re not in a group yet</p>
          <p className="mt-1 text-amber-900/90">
            Create a group or join with a UUID from your organizer under{" "}
            <Link href="/places" className="font-semibold text-amber-950 underline">
              My Places
            </Link>
            . Sign out and sign in as another user to demo a different account.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          You’re in <strong>{groupMeta.name}</strong>. Share the group UUID below so others can join from My Places.
        </div>
      )}

      <div className="planner-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm text-slate-500">{groupMeta ? "Group" : "No group"}</p>
          <p className="text-lg font-semibold">{groupMeta ? groupMeta.name : "—"}</p>
          {groupMeta ? <p className="mt-1 font-mono text-xs text-slate-600 break-all">{groupMeta.id}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {groupMeta ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              onClick={() => void copyGroupCode()}
            >
              <Copy size={16} className="shrink-0" />
              {copiedCode ? "Copied!" : "Copy group UUID"}
            </Button>
          ) : null}
          {groupMeta && isAdmin ? (
            <Button
              type="button"
              variant="outline"
              className="border-red-200 bg-white text-red-700 hover:bg-red-50"
              onClick={() => setDeleteGroupOpen(true)}
            >
              Delete group
            </Button>
          ) : null}
          <InviteModal />
        </div>
      </div>

      {groupActionError ? (
        <p className="text-sm text-red-600" role="alert">
          {groupActionError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <MemberList
          members={members}
          isAdmin={isAdmin}
          soleAdmin={soleAdmin}
          onRemoveMember={isAdmin ? (id) => void handleRemoveMember(id) : undefined}
          onLeaveGroup={!soleAdmin ? () => void handleLeaveGroup() : undefined}
          actionBusyId={memberActionId}
        />
        {groupMeta ? (
          <VotingPanel
            title="Demo voting"
            description="Sample spots for pitches — your +/− votes stay in this browser only (not saved to the database)."
            places={demoVoting.places}
            myVotePlaceId={demoVoting.myVotePlaceId}
            onVote={onDemoVote}
          />
        ) : (
          <div className="planner-card p-4 text-sm text-slate-600">Join a group to see voting.</div>
        )}
      </div>

      <Dialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this group?</DialogTitle>
            <DialogDescription>
              This removes all members and votes tied to this group. Other tables (e.g. places) are kept. You cannot
              undo this.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteGroupOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteGroupBusy}
              onClick={() => void handleDeleteGroup()}
            >
              {deleteGroupBusy ? "Deleting…" : "Delete group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
