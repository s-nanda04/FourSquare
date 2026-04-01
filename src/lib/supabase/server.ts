import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseUrlAndKey } from "@/lib/supabase/env";

export async function createClient() {
  const { url, anonKey } = getSupabaseUrlAndKey();

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* ignore when called from a Server Component without mutable cookies */
        }
      },
    },
  });
}
