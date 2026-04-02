import { redirect } from "next/navigation";
import { DashboardPlannerSection } from "@/components/dashboard/dashboard-planner-section";
import { DashboardSidebarColumn } from "@/components/dashboard/dashboard-sidebar-column";
import { PlaceCard } from "@/components/places/place-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardGroupProvider } from "@/contexts/dashboard-group-context";
import { getFirstName } from "@/lib/auth/user-display";
import { createClient } from "@/lib/supabase/server";

const recentPlaces = [
  {
    id: 1,
    name: "Trattoria Il Panino",
    category: "Food",
    rating: 4.7,
    distance: "1.4 mi",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    name: "Boston Public Library",
    category: "Activities",
    rating: 4.8,
    distance: "2.0 mi",
    image:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    name: "Flour Bakery",
    category: "Cafes",
    rating: 4.5,
    distance: "1.1 mi",
    image:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=80",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const welcomeName = getFirstName(user);
  const loading = false;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="planner-card p-4">
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-3 h-8 w-1/3">
              <Skeleton className="h-full w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DashboardGroupProvider>
      <div className="space-y-4">
        <DashboardPlannerSection welcomeName={welcomeName} />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="planner-card p-4 lg:col-span-2">
            <h3 className="mb-3 font-semibold">Recently Suggested</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentPlaces.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </div>

          <DashboardSidebarColumn />
        </div>
      </div>
    </DashboardGroupProvider>
  );
}
