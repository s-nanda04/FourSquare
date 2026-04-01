-- FourSquare: core schema for places, groups, visits, voting, and recommendation dedup.
-- Apply in Supabase: SQL Editor → New query → paste → Run, or use `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users) — signup role maps to account_kind:
--   organizer  ≈ "Admin" in UI (creates / manages groups)
--   participant ≈ "Member" (primarily invited)
-- Per-group power: group_members.role = admin | member
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  account_kind text not null default 'participant'
    constraint profiles_account_kind_check check (account_kind in ('organizer', 'participant')),
  share_location boolean not null default false,
  profile_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_account_kind_idx on public.profiles (account_kind);

-- ---------------------------------------------------------------------------
-- Place taxonomy + canonical places (Google Place id + geo)
-- ---------------------------------------------------------------------------
create table public.place_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name text not null,
  formatted_address text,
  lat double precision not null,
  lng double precision not null,
  place_type_id uuid references public.place_types (id) on delete set null,
  visit_count_cache integer not null default 0,
  created_at timestamptz not null default now()
);

create index places_place_type_id_idx on public.places (place_type_id);
create index places_lat_lng_idx on public.places (lat, lng);

-- ---------------------------------------------------------------------------
-- Groups + membership (RBAC per group)
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member'
    constraint group_members_role_check check (role in ('admin', 'member')),
  points integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_id_idx on public.group_members (user_id);

-- ---------------------------------------------------------------------------
-- Visits / check-ins
-- ---------------------------------------------------------------------------
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  group_id uuid references public.groups (id) on delete set null,
  visited_at timestamptz not null default now(),
  note text
);

create index visits_user_id_idx on public.visits (user_id);
create index visits_place_id_idx on public.visits (place_id);
create index visits_group_id_idx on public.visits (group_id);
create index visits_visited_at_idx on public.visits (visited_at desc);

-- ---------------------------------------------------------------------------
-- Group votes
-- ---------------------------------------------------------------------------
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  value smallint not null constraint votes_value_check check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (group_id, user_id, place_id)
);

create index votes_group_id_idx on public.votes (group_id);

-- ---------------------------------------------------------------------------
-- Recommendation impressions (dedupe / tune discovery)
-- ---------------------------------------------------------------------------
create table public.recommendation_impressions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  algorithm_version text not null default 'v1',
  shown_at timestamptz not null default now(),
  constraint recommendation_impressions_target_check check (user_id is not null or group_id is not null)
);

create index recommendation_impressions_user_place_idx
  on public.recommendation_impressions (user_id, place_id, algorithm_version);
create index recommendation_impressions_group_place_idx
  on public.recommendation_impressions (group_id, place_id, algorithm_version);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, account_kind)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'account_kind', 'participant')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.add_creator_as_group_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created_add_admin
  after insert on public.groups
  for each row execute function public.add_creator_as_group_admin();

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.place_types enable row level security;
alter table public.places enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.visits enable row level security;
alter table public.votes enable row level security;
alter table public.recommendation_impressions enable row level security;

create policy "profiles_select_own_or_public"
  on public.profiles for select
  using (id = (select auth.uid()) or profile_public = true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "place_types_select_authenticated"
  on public.place_types for select
  to authenticated
  using (true);

create policy "place_types_write_authenticated"
  on public.place_types for insert
  to authenticated
  with check (true);

create policy "places_select_authenticated"
  on public.places for select
  to authenticated
  using (true);

create policy "places_insert_authenticated"
  on public.places for insert
  to authenticated
  with check (true);

create policy "places_update_authenticated"
  on public.places for update
  to authenticated
  using (true)
  with check (true);

create policy "groups_select_member"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id and gm.user_id = (select auth.uid())
    )
  );

create policy "groups_insert_authenticated"
  on public.groups for insert
  with check (created_by = (select auth.uid()));

create policy "groups_update_admin"
  on public.groups for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = (select auth.uid())
        and gm.role = 'admin'
    )
  );

create policy "groups_delete_admin"
  on public.groups for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = (select auth.uid())
        and gm.role = 'admin'
    )
  );

create policy "group_members_select_coworker"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = (select auth.uid())
    )
  );

-- Creator can add themselves as first admin (bootstrap). Other admins add members via second policy.
create policy "group_members_insert_creator_bootstrap"
  on public.group_members for insert
  with check (
    user_id = (select auth.uid())
    and role = 'admin'
    and exists (
      select 1 from public.groups g
      where g.id = group_members.group_id
        and g.created_by = (select auth.uid())
    )
  );

create policy "group_members_insert_admin"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = (select auth.uid())
        and gm.role = 'admin'
    )
  );

create policy "group_members_update_admin"
  on public.group_members for update
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = (select auth.uid())
        and gm.role = 'admin'
    )
  );

create policy "group_members_delete_admin_or_self"
  on public.group_members for delete
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = (select auth.uid())
        and gm.role = 'admin'
    )
  );

create policy "visits_select_own_or_group"
  on public.visits for select
  using (
    user_id = (select auth.uid())
    or (
      group_id is not null
      and exists (
        select 1 from public.group_members gm
        where gm.group_id = visits.group_id
          and gm.user_id = (select auth.uid())
      )
    )
  );

create policy "visits_insert_own"
  on public.visits for insert
  with check (user_id = (select auth.uid()));

create policy "votes_select_group"
  on public.votes for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = votes.group_id
        and gm.user_id = (select auth.uid())
    )
  );

create policy "votes_insert_member"
  on public.votes for insert
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = votes.group_id
        and gm.user_id = (select auth.uid())
    )
  );

create policy "votes_update_own"
  on public.votes for update
  using (user_id = (select auth.uid()));

create policy "votes_delete_own"
  on public.votes for delete
  using (user_id = (select auth.uid()));

create policy "recommendation_impressions_select"
  on public.recommendation_impressions for select
  using (
    user_id = (select auth.uid())
    or (
      group_id is not null
      and exists (
        select 1 from public.group_members gm
        where gm.group_id = recommendation_impressions.group_id
          and gm.user_id = (select auth.uid())
      )
    )
  );

create policy "recommendation_impressions_insert"
  on public.recommendation_impressions for insert
  with check (
    (
      user_id = (select auth.uid())
      and (
        group_id is null
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = recommendation_impressions.group_id
            and gm.user_id = (select auth.uid())
        )
      )
    )
  );

-- Seed a few place types (optional)
insert into public.place_types (slug, name) values
  ('restaurant', 'Restaurant'),
  ('cafe', 'Cafe'),
  ('bar', 'Bar'),
  ('event', 'Event'),
  ('activity', 'Activity'),
  ('outdoor', 'Outdoor')
on conflict (slug) do nothing;
