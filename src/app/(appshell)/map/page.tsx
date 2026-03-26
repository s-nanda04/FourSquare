import { DirectionsPanel } from "@/components/map/directions-panel";
import { MapView } from "@/components/map/map-view";
import { MemberLocationPanel } from "@/components/map/member-location-panel";

export default function MapPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <MapView />
      <div className="space-y-4">
        <MemberLocationPanel />
        <DirectionsPanel />
      </div>
    </div>
  );
}
