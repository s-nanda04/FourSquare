type CheckIn = {
  id: number;
  place: string;
  category: string;
  date: string;
  note: string;
};

export function PlaceTimeline({ checkIns }: { checkIns: CheckIn[] }) {
  if (checkIns.length === 0) {
    return <div className="planner-card p-6 text-center text-slate-600">No check-ins yet.</div>;
  }

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Check-in Timeline</h3>
      <div className="space-y-3">
        {checkIns.map((checkIn) => (
          <div key={checkIn.id} className="border-l-2 border-primary pl-3">
            <p className="font-medium">{checkIn.place}</p>
            <p className="text-xs text-slate-500">
              {checkIn.category} • {checkIn.date}
            </p>
            <p className="text-sm text-slate-600">{checkIn.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
