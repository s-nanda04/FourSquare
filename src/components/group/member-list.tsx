import { Badge } from "@/components/ui/badge";

type Member = {
  id: number;
  name: string;
  role: "Admin" | "Member";
  online: boolean;
};

export function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="planner-card p-4">
      <h3 className="mb-3 font-semibold">Members</h3>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {member.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-slate-500">
                  {member.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <Badge variant="secondary">{member.role}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
