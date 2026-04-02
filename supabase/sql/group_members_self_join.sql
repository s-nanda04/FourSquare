-- Run in Supabase SQL Editor if join-group fails with RLS. (Also in migrations/20260331160000_group_members_self_join.sql)

create policy "group_members_insert_self_member"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'member'
  );
