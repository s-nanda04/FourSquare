"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePublic, setProfilePublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, profile_public")
        .eq("id", user.id)
        .maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setProfilePublic(profile?.profile_public ?? false);
      setLoading(false);
    }
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Not signed in.");
      setSaving(false);
      return;
    }
    const name = displayName.trim();
    const { error: pErr } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: name || null,
        profile_public: profilePublic,
      },
      { onConflict: "id" },
    );
    if (pErr) {
      const msg = pErr.message ?? "";
      if (
        msg.includes("schema cache") ||
        msg.includes("Could not find the table") ||
        msg.includes("does not exist")
      ) {
        setMessage(
          "The profiles table is missing in your Supabase project. Open the SQL Editor and run the script at supabase/sql/profiles_only.sql (or apply the full migration in supabase/migrations), then try again.",
        );
      } else {
        setMessage(msg);
      }
      setSaving(false);
      return;
    }
    await supabase.auth.updateUser({
      data: { display_name: name || undefined },
    });
    setMessage("Saved.");
    setSaving(false);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="planner-card p-6 text-slate-600">Loading profile…</div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="planner-card space-y-4 p-6 text-slate-900">
        <h1 className="text-lg font-semibold">Profile & privacy</h1>
        <p className="text-sm text-slate-600">
          Updates sync to Supabase (<code className="rounded bg-slate-100 px-1">profiles</code>) and your session
          name.
        </p>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="bg-slate-50 text-slate-700" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you appear in the app"
            className="text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="profile-pub"
            type="checkbox"
            checked={profilePublic}
            onChange={(e) => setProfilePublic(e.target.checked)}
            className="size-4 rounded border-slate-300"
          />
          <Label htmlFor="profile-pub" className="font-normal">
            Public profile (others can see my display name in discovery features)
          </Label>
        </div>

        {message ? (
          <p
            className={`text-sm ${message.startsWith("Saved") ? "text-emerald-700" : "text-red-700"}`}
          >
            {message}
          </p>
        ) : null}

        <Button type="button" className="w-full" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">Sign out</h2>
          <p className="mt-1 text-sm text-slate-600">
            End your session on this device. You can sign in again anytime.
          </p>
          <LogoutButton
            variant="destructive"
            showIcon
            label="Log out"
            className="mt-4 h-10 w-full text-base font-semibold shadow-sm ring-1 ring-destructive/25"
          />
        </div>
      </div>
    </div>
  );
}
