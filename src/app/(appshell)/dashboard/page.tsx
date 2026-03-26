import { PlaceCard } from "@/components/places/place-card";
import { Skeleton } from "@/components/ui/skeleton";

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

const members = [
  { name: "Shreya Patel", online: true, points: 120 },
  { name: "Noah Kim", online: true, points: 105 },
  { name: "Ava Chen", online: false, points: 94 },
];

export default function DashboardPage() {
  const loading = false;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="planner-card p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-3 h-8 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="planner-card p-4">
        <h3 className="text-lg font-semibold">Welcome back, Shreya</h3>
        <p className="text-sm text-slate-600">Your group has 2 upcoming plans this week.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Upcoming Plans</p>
          <p className="text-2xl font-semibold">2</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Members Online</p>
          <p className="text-2xl font-semibold">3</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Recent Check-ins</p>
          <p className="text-2xl font-semibold">8</p>
        </div>
        <div className="planner-card p-4">
          <p className="text-sm text-slate-500">Top Voted Place</p>
          <p className="text-xl font-semibold">Neptune Oyster</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="planner-card p-4 lg:col-span-2">
          <h3 className="mb-3 font-semibold">Recently Suggested</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="planner-card p-4">
            <h3 className="mb-3 font-semibold">Your Group</h3>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-slate-500">
                      {member.online ? "Online" : "Offline"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{member.points} pts</span>
                </div>
              ))}
            </div>
          </div>
          <div className="planner-card p-4">
            <h3 className="font-semibold">Target Tracker</h3>
            <p className="mt-2 text-sm text-slate-600">Weekend challenge: 3 group check-ins.</p>
            <p className="mt-2 font-semibold">Progress: 2 / 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
