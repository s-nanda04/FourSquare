import { createClient } from "@/lib/supabase/client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Not signed in. Sign in again, then retry.");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const network =
      message === "Failed to fetch" ||
      message.includes("NetworkError") ||
      message.includes("Load failed");
    throw new Error(
      network
        ? `Cannot reach API at ${BASE_URL}. Start the backend (e.g. uvicorn) or set NEXT_PUBLIC_API_URL.`
        : message,
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(detail || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
