import type { User } from "@supabase/supabase-js";

/** Display name from signup metadata, Google (`full_name` / `name`), or email. */
export function getDisplayName(user: User | null): string {
  if (!user) return "Guest";
  const m = user.user_metadata as Record<string, unknown>;
  const str = (k: string) => (typeof m[k] === "string" ? (m[k] as string).trim() : "");
  const fromMeta =
    str("display_name") ||
    str("full_name") ||
    str("name") ||
    str("preferred_username");
  if (fromMeta) return fromMeta;
  return user.email?.split("@")[0] ?? "User";
}

export function getFirstName(user: User | null): string {
  const full = getDisplayName(user);
  const part = full.split(/\s+/)[0];
  return part || full;
}
