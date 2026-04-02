"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  label?: string;
  /** When false, only the label is shown (clearer “Log out” text). */
  showIcon?: boolean;
};

export function LogoutButton({
  variant = "outline",
  className,
  label = "Log out",
  showIcon = true,
}: LogoutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={cn("gap-2", !showIcon && "justify-center", className)}
      disabled={busy}
      onClick={() => void handleLogout()}
    >
      {showIcon ? <LogOut className="size-4 shrink-0" aria-hidden /> : null}
      <span className={showIcon ? undefined : "w-full text-center"}>{busy ? "Signing out…" : label}</span>
    </Button>
  );
}
