"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDisplayName } from "@/lib/auth/user-display";

type ProfileRow = { account_kind: string | null };

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLabel, setRoleLabel] = useState("Member");

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user: next },
      } = await supabase.auth.getUser();
      setUser(next ?? null);

      if (next) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_kind")
          .eq("id", next.id)
          .maybeSingle<ProfileRow>();

        const fromMeta = (next.user_metadata as { account_kind?: string })?.account_kind;
        const kind = profile?.account_kind ?? fromMeta ?? "participant";
        setRoleLabel(kind === "organizer" ? "Organizer" : "Member");
      } else {
        setRoleLabel("Member");
      }
      setLoading(false);
    }

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    displayName: user ? getDisplayName(user) : null,
    roleLabel,
  };
}
