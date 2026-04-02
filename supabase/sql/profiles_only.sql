-- Run this in Supabase Dashboard → SQL Editor if you see:
-- "Could not find the table 'public.profiles' in the schema cache"
-- (Your project never received the full migration.)
-- Safe to run once; skips objects that already exist.
--
-- If My Places → Create group fails on missing public.groups, run:
--   supabase/sql/groups_and_members_bootstrap.sql

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
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

create index if not exists profiles_account_kind_idx on public.profiles (account_kind);

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_public" on public.profiles;
create policy "profiles_select_own_or_public"
  on public.profiles for select
  using (id = (select auth.uid()) or profile_public = true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Backfill rows for accounts created before this table existed.
insert into public.profiles (id, display_name, account_kind)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'account_kind', 'participant')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
