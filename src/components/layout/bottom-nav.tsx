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
  { href: "/dashboard", icon: LayoutDashboard },
  { href: "/discover", icon: Compass },
  { href: "/places", icon: MapPin },
  { href: "/group", icon: Users },
  { href: "/map", icon: Map },
  { href: "/calendar", icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 p-2 lg:hidden">
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md p-2 text-slate-300",
                pathname === link.href && "bg-primary text-white"
              )}
            >
              <Icon size={18} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
