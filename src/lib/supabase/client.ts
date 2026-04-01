import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrlAndKey } from "@/lib/supabase/env";

export function createClient() {
  const { url, anonKey } = getSupabaseUrlAndKey();
  return createBrowserClient(url, anonKey);
}
