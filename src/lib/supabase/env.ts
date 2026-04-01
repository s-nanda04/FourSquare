/**
 * Read and normalize Supabase URL + anon key from NEXT_PUBLIC env.
 * Trailing slashes, stray paths, and whitespace are common causes of "Failed to fetch".
 */
export function getSupabaseUrlAndKey(): { url: string; anonKey: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!rawUrl || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl);
  } catch {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL must be a full URL (e.g. https://YOUR_REF.supabase.co — copy from Supabase → Project Settings → API).',
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use https://");
  }

  // API expects project root, not /auth/v1 or other paths
  const url = parsed.origin;

  return { url, anonKey };
}

/** Shared check for browser / Supabase client network failures. */
export function isSupabaseNetworkFailureMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("failed to fetch") ||
    m.includes("fetch failed") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("load failed")
  );
}

export function isAuthNetworkError(err: unknown): boolean {
  return err instanceof Error && isSupabaseNetworkFailureMessage(err.message);
}

/** Use for `const { error } = await supabase.auth.*` — network errors are returned, not thrown. */
export function formatSupabaseAuthError(error: { message: string }): string {
  if (isSupabaseNetworkFailureMessage(error.message)) {
    return authNetworkErrorMessage();
  }
  return error.message;
}

export function authNetworkErrorMessage(): string {
  return [
    "Could not reach Supabase from the browser.",
    "",
    "• In .env.local set NEXT_PUBLIC_SUPABASE_URL to: https://YOUR_PROJECT_REF.supabase.co (Project Settings → API — no quotes or extra path).",
    "• Restart the dev server after changing .env.local.",
    "• In Supabase, make sure the project is not paused.",
    "• Try turning off VPN/ad blockers for *.supabase.co or use another network.",
  ].join("\n");
}
