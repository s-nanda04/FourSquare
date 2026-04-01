"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { authNetworkErrorMessage, formatSupabaseAuthError, isAuthNetworkError } from "@/lib/supabase/env";
import type { AccountKind } from "@/types/database";

function FeedbackBanner({ message }: { message: string }) {
  const success =
    message.includes("Almost done") ||
    message.includes("Account created") ||
    message.includes("signed in");
  const warn =
    message.includes("Enter your") ||
    message.includes("Password must") ||
    message.includes("Configure Supabase") ||
    message.includes("Could not reach Supabase");
  const alertClass = success
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : warn
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div
      role={success ? "status" : "alert"}
      aria-live={success ? "polite" : "assertive"}
      className={`rounded-md border px-3 py-3 text-sm font-medium whitespace-pre-line ${alertClass}`}
    >
      {message}
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <p className="text-sm text-slate-400">Loading…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupRole, setSignupRole] = useState<"admin" | "member">("member");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseReady =
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!supabaseReady) {
      setMessage("Configure Supabase env vars (copy .env.example to .env.local) and restart the dev server.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setMessage(formatSupabaseAuthError(error));
        return;
      }
      router.push(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
      router.refresh();
    } catch (err) {
      if (isAuthNetworkError(err)) {
        setMessage(authNetworkErrorMessage());
      } else {
        setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!supabaseReady) {
      setMessage("Configure Supabase env vars (copy .env.example to .env.local) and restart the dev server.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Enter your email.");
      return;
    }
    if (!password || password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    const accountKind: AccountKind = signupRole === "admin" ? "organizer" : "participant";
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          data: {
            display_name: name.trim() || trimmedEmail.split("@")[0],
            account_kind: accountKind,
          },
        },
      });
      if (error) {
        setMessage(formatSupabaseAuthError(error));
        return;
      }
      if (data.session) {
        setMessage("Account created. You’re signed in — taking you to the dashboard…");
        router.push(
          nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard",
        );
        router.refresh();
        return;
      }
      setMessage(
        "Almost done — we sent a confirmation link to your email. Open it to finish sign-up, then sign in here.",
      );
    } catch (err) {
      if (isAuthNetworkError(err)) {
        setMessage(authNetworkErrorMessage());
      } else {
        setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 text-slate-900 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "#fa4779" }}>
            FourSquare
          </h1>
          <p className="text-sm text-slate-500">Plan together, move together.</p>
        </div>

        {searchParams.get("error") === "auth" && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign-in link expired or is invalid. Try again.
          </p>
        )}

        {message && (
          <FeedbackBanner message={message} />
        )}

        {!supabaseReady && (
          <p className="text-xs text-slate-500">
            Add <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
            <code className="rounded bg-slate-100 px-1">.env.local</code>.
          </p>
        )}

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name-example@gmail.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
            <div className="text-center text-xs text-slate-500">Or continue with Google</div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:text-slate-900"
              disabled={!supabaseReady || loading}
              onClick={async () => {
                if (!supabaseReady) return;
                setMessage(null);
                try {
                  const supabase = createClient();
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
                    },
                  });
                  if (error) setMessage(formatSupabaseAuthError(error));
                } catch (err) {
                  if (isAuthNetworkError(err)) setMessage(authNetworkErrorMessage());
                  else setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
                }
              }}
            >
              Continue with Google
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={signupRole}
                onChange={(ev) => setSignupRole(ev.target.value as "admin" | "member")}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none focus:border-[#fa4779] focus:ring-1 focus:ring-[#fa4779]"
              >
                <option value="admin">Admin (organizer — create & manage groups)</option>
                <option value="member">Member (invited participant)</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={() => {
            setMode((current) => (current === "signin" ? "signup" : "signin"));
            setMessage(null);
          }}
          className="w-full text-sm text-primary"
        >
          {mode === "signin" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
        </button>

        <p className="text-center text-xs text-slate-400">
          Privacy: <span className="text-slate-500">toggle share location and public profile in settings</span>{" "}
          (enforced with Supabase RLS).
        </p>
      </div>
    </div>
  );
}
