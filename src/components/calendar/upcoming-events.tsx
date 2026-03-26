type EventItem = {
  id: number;
  date: string;
  title: string;
};

export function UpcomingEvents({ events }: { events: EventItem[] }) {
  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Upcoming Events</h3>
      {events.length === 0 ? (
        <p className="text-sm text-slate-600">No upcoming events.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div key={event.id} className="rounded-md bg-slate-100 p-2">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-slate-500">{event.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
