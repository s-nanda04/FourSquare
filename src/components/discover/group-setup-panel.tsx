"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { createGroup, joinGroup } from "@/lib/discover-api";

async function ensureSessionClient() {
  const supabase = createClient();
  let { data } = await supabase.auth.getSession();
  if (!data.session) {
    const refreshed = await supabase.auth.refreshSession();
    data = refreshed.data;
  }
  if (!data.session?.access_token) {
    throw new Error("Session expired. Sign out and sign in again, then retry.");
  }
}

function formatSchemaError(message: string): string {
  if (/schema cache|could not find the table.*groups/i.test(message)) {
    return `${message} Your Supabase project is missing the groups tables. In the Supabase dashboard → SQL Editor, paste and run the file supabase/sql/groups_and_members_bootstrap.sql from this repo, then wait a few seconds and try again. (Alternatively apply the full migration supabase/migrations/20260331120000_initial_schema.sql.)`;
  }
  return message;
}

export function GroupSetupPanel({ onChanged }: { onChanged: () => void }) {
  const [groupName, setGroupName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleCreate() {
    if (!groupName.trim()) {
      setMsg("Enter a group name.");
      return;
    }
    setBusy("create");
    setMsg(null);
    try {
      await ensureSessionClient();
      await createGroup(groupName.trim());
      setGroupName("");
      onChanged();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Could not create group.";
      setMsg(formatSchemaError(m));
    } finally {
      setBusy(null);
    }
  }

  async function handleJoin() {
    if (!joinId.trim()) {
      setMsg("Paste a group ID (UUID) from your organizer.");
      return;
    }
    setBusy("join");
    setMsg(null);
    try {
      await ensureSessionClient();
      await joinGroup(joinId.trim());
      setJoinId("");
      onChanged();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Could not join group.";
      setMsg(formatSchemaError(m));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="planner-card space-y-6 p-4 text-slate-900">
      <div>
        <h3 className="font-semibold text-slate-900">You’re not in a group yet</h3>
        <p className="mt-1 text-sm text-slate-600">
          Create one (you’ll be admin) or join with an invite ID from Supabase / your teammate.
        </p>
      </div>

      {msg ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {msg}
        </p>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <Label htmlFor="new-group-name">Create a group</Label>
          <Input
            id="new-group-name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Boston Crew"
            className="text-slate-900"
          />
          <Button
            type="button"
            className="w-full"
            disabled={busy !== null}
            onClick={() => void handleCreate()}
          >
            {busy === "create" ? "Creating…" : "Create group"}
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <Label htmlFor="join-group-id">Join with group ID</Label>
          <Input
            id="join-group-id"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="font-mono text-sm text-slate-900"
          />
          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            disabled={busy !== null}
            onClick={() => void handleJoin()}
          >
            {busy === "join" ? "Joining…" : "Join group"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Create/join uses your Supabase project directly (no local FastAPI). If you see an error about{" "}
        <code className="rounded bg-slate-100 px-1">public.groups</code>, run{" "}
        <code className="rounded bg-slate-100 px-1">supabase/sql/groups_and_members_bootstrap.sql</code> in the SQL
        Editor first. Optional: <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_DEFAULT_GROUP_ID</code> in{" "}
        <code className="rounded bg-slate-100 px-1">.env.local</code> for a fixed test group.
      </p>
    </div>
  );
}
