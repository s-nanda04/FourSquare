-- Run in Supabase → SQL Editor if you get:
--   "Could not find the table 'public.groups' in the schema cache"
-- (Usually you ran profiles_only.sql but not the full app migration.)
--
-- Membership checks use SECURITY DEFINER helpers so RLS policies do not recurse on
-- public.group_members (Postgres error: infinite recursion detected in policy).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Groups + membership
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member'
    constraint group_members_role_check check (role in ('admin', 'member')),
  points integer not null default 0,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_id_idx on public.group_members (user_id);

-- Creator → admin row (trigger after insert on groups)
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

drop trigger if exists on_group_created_add_admin on public.groups;
create trigger on_group_created_add_admin
  after insert on public.groups
  for each row execute function public.add_creator_as_group_admin();

-- ---------------------------------------------------------------------------
-- Helpers: read membership without RLS recursion on group_members
-- ---------------------------------------------------------------------------
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id
  );
$$;

create or replace function public.is_group_admin(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id and role = 'admin'
  );
$$;

create or replace function public.is_group_creator(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.groups
    where id = p_group_id and created_by = p_user_id
  );
$$;

grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_admin(uuid, uuid) to authenticated;
grant execute on function public.is_group_creator(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "groups_select_member" on public.groups;
-- Creator can read rows they created (needed for PostgREST .insert().select() RETURNING);
-- members read via is_group_member.
create policy "groups_select_member"
  on public.groups for select
  using (
    created_by = (select auth.uid())
    or public.is_group_member(id, (select auth.uid()))
  );

drop policy if exists "groups_insert_authenticated" on public.groups;
create policy "groups_insert_authenticated"
  on public.groups for insert
  to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "groups_update_admin" on public.groups;
create policy "groups_update_admin"
  on public.groups for update
  using (public.is_group_admin(id, (select auth.uid())));

drop policy if exists "groups_delete_admin" on public.groups;
create policy "groups_delete_admin"
  on public.groups for delete
  using (public.is_group_admin(id, (select auth.uid())));

drop policy if exists "group_members_select_coworker" on public.group_members;
create policy "group_members_select_coworker"
  on public.group_members for select
  using (public.is_group_member(group_id, (select auth.uid())));

drop policy if exists "group_members_insert_creator_bootstrap" on public.group_members;
create policy "group_members_insert_creator_bootstrap"
  on public.group_members for insert
  with check (
    user_id = (select auth.uid())
    and role = 'admin'
    and public.is_group_creator(group_id, (select auth.uid()))
  );

drop policy if exists "group_members_insert_admin" on public.group_members;
create policy "group_members_insert_admin"
  on public.group_members for insert
  with check (
    public.is_group_admin(group_id, (select auth.uid()))
  );

-- Self-join with invite UUID (used by “Join group” in the app)
drop policy if exists "group_members_insert_self_member" on public.group_members;
create policy "group_members_insert_self_member"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'member'
  );

drop policy if exists "group_members_update_admin" on public.group_members;
create policy "group_members_update_admin"
  on public.group_members for update
  using (public.is_group_admin(group_id, (select auth.uid())));

drop policy if exists "group_members_delete_admin_or_self" on public.group_members;
create policy "group_members_delete_admin_or_self"
  on public.group_members for delete
  using (
    user_id = (select auth.uid())
    or public.is_group_admin(group_id, (select auth.uid()))
  );
