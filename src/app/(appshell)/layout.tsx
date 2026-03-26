import { BottomNav } from "@/components/layout/bottom-nav";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Sidebar } from "@/components/layout/sidebar";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <PageWrapper>{children}</PageWrapper>
      <BottomNav />
    </div>
  );
}
