import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrlAndKey } from "@/lib/supabase/env";

function isProtectedPath(pathname: string) {
  if (pathname === "/") return false;
  return ["/dashboard", "/places", "/map", "/group", "/discover", "/calendar"].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let url: string;
  let anonKey: string;
  try {
    const cfg = getSupabaseUrlAndKey();
    url = cfg.url;
    anonKey = cfg.anonKey;
  } catch {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/login" && user) {
    const rawNext = request.nextUrl.searchParams.get("next") || "/dashboard";
    const safeNext =
      rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = safeNext;
    redirectUrl.searchParams.delete("next");
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
