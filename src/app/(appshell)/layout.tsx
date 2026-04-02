import { BottomNav } from "@/components/layout/bottom-nav";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Sidebar } from "@/components/layout/sidebar";
import { MyPlacesProvider } from "@/contexts/my-places-context";
import { PlannerEventsProvider } from "@/contexts/planner-events-context";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlannerEventsProvider>
      <MyPlacesProvider>
        <div className="flex min-h-screen bg-slate-900">
          <Sidebar />
          <PageWrapper>{children}</PageWrapper>
          <BottomNav />
        </div>
      </MyPlacesProvider>
    </PlannerEventsProvider>
  );
}
