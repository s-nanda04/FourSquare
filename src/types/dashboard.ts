/** `GET /groups/{group_id}/dashboard` (FastAPI) */
export type GroupDashboardApiResponse = {
  upcoming_plans: number;
  members_online: number;
  recent_checkins: number;
  top_voted_place: string;
  members: { name: string }[];
  target: {
    description: string;
    goal: number;
    progress: number;
  };
};

export type DashboardMember = {
  id: string;
  name: string;
  isYou: boolean;
};

export type DashboardStats = {
  recentCheckins: number | null;
  topVotedPlace: string | null;
  target: {
    description: string;
    goal: number;
    progress: number;
  };
};
