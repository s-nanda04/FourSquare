"use client";

import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discover": "Discover",
  "/places": "My Places",
  "/group": "Group",
  "/map": "Live Map",
  "/calendar": "Calendar",
};

export function Topbar() {
  const pathname = usePathname();
  const title = titleMap[pathname] ?? "Planner";

  return (
    <header className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <Badge className="bg-primary text-white">Your group</Badge>
        <button className="rounded-lg bg-white/10 p-2 text-white">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
