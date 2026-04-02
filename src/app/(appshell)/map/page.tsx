import { DirectionsPanel } from "@/components/map/directions-panel";
import { MapView } from "@/components/map/map-view";

export default function MapPage() {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col gap-4 lg:min-h-[calc(100dvh-4rem)]">
      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[1fr_300px] lg:gap-4">
        <div className="flex min-h-[min(72vh,760px)] flex-1 flex-col lg:min-h-0">
          <MapView />
        </div>
        <div className="mt-4 flex shrink-0 flex-col gap-4 lg:mt-0">
          <DirectionsPanel />
        </div>
      </div>
    </div>
  );
}
