"use client";

import { usePathname } from "next/navigation";
import { BellNotifications } from "@/components/layout/bell-notifications";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discover": "Discover",
  "/places": "My Places",
  "/group": "Group",
  "/map": "Live Map",
  "/calendar": "Calendar",
  "/profile": "Profile",
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
        <BellNotifications />
      </div>
    </header>
  );
}
