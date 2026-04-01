/** App-level signup role (stored in profiles.account_kind). */
export type AccountKind = "organizer" | "participant";

/** Per-group role for RBAC (group organizing vs invited member). */
export type GroupMemberRole = "admin" | "member";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  account_kind: AccountKind;
  share_location: boolean;
  profile_public: boolean;
  created_at: string;
  updated_at: string;
};
