import { ReactNode } from "react";
import { Topbar } from "@/components/layout/topbar";

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex-1 p-4 pb-20 lg:p-6">
      <Topbar />
      {children}
    </main>
  );
}
