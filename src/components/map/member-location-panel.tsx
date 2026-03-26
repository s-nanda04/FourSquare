export function MemberLocationPanel() {
  const members = [
    { name: "Shreya", location: "Back Bay", color: "bg-green-500" },
    { name: "Noah", location: "North End", color: "bg-blue-500" },
    { name: "Ava", location: "Seaport", color: "bg-purple-500" },
  ];

  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Member Locations</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${member.color}`} />
              {member.name}
            </span>
            <span className="text-slate-500">{member.location}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
