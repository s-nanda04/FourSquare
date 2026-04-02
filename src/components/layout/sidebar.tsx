"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Compass,
  LayoutDashboard,
  Map,
  MapPin,
  Users,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/places", label: "My Places", icon: MapPin },
  { href: "/group", label: "Group", icon: Users },
  { href: "/map", label: "Map", icon: Map },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const { displayName, loading, roleLabel } = useUser();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-950/70 px-4 py-6 lg:flex lg:flex-col">
      <h1 className="mb-8 text-xl font-bold" style={{ color: "#fa4779" }}>FourSquare</h1>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white",
                active && "bg-primary text-white"
              )}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/profile"
        className={cn(
          "mt-auto flex items-center justify-between gap-2 rounded-lg bg-white/10 p-3 text-sm text-slate-200 transition hover:bg-white/15",
          pathname === "/profile" && "ring-1 ring-primary/60",
        )}
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{loading ? "…" : displayName ?? "Signed out"}</p>
          <p className="text-xs text-slate-300">{roleLabel}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden />
      </Link>
    </aside>
  );
}
