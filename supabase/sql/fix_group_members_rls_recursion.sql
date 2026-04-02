-- Fix: infinite recursion detected in policy for relation "group_members"
-- Fix: new row violates row-level security policy for table "groups"
--
-- Run in Supabase → SQL Editor after an older bootstrap. The groups fixes:
--   • SELECT allows created_by = auth.uid() OR is_group_member (RETURNING on create)
--   • INSERT is limited to role authenticated with check created_by = auth.uid()
--
-- Safe to run multiple times (idempotent helpers + drop/create policies).

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

drop policy if exists "groups_select_member" on public.groups;
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
