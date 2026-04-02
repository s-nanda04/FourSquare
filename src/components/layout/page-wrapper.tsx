import { ReactNode } from "react";
import { Topbar } from "@/components/layout/topbar";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 flex-col p-4 pb-20 lg:p-6">
      <div className="shrink-0">
        <Topbar />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </main>
  );
}
