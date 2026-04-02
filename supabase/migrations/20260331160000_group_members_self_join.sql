-- Allow authenticated users to join a group by adding themselves as member (invite / known UUID).
-- Required for client-side join without the FastAPI service role.

create policy "group_members_insert_self_member"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'member'
  );
