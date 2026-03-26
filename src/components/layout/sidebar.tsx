"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Compass,
  LayoutDashboard,
  Map,
  MapPin,
  Users,
} from "lucide-react";
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

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-950/70 px-4 py-6 lg:flex lg:flex-col">
      <h1 className="mb-8 text-xl font-semibold text-white">FourSquare</h1>
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
      <div className="mt-auto rounded-lg bg-white/10 p-3 text-sm text-slate-200">
        <p className="font-medium">Shreya Patel</p>
        <p className="text-xs text-slate-300">Admin</p>
      </div>
    </aside>
  );
}
