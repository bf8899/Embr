-- Phase A: profiles table (viewer/creator role selection) + auto-provisioning on signup.
-- Named `profiles` rather than the build plan's `users` since it extends Supabase's
-- built-in auth.users rather than replacing it. videos/follows/comments/tips/likes/reports
-- land in later phases per the phased build plan.

create type public.profile_role as enum ('viewer', 'creator', 'both');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  handle text not null unique,
  role public.profile_role not null default 'viewer',
  avatar_url text,
  bio text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user is created, so the app
-- never has to handle a signed-in user with no profile. handle is a
-- placeholder the user replaces during onboarding.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, handle)
  values (new.id, new.email, 'user_' || substr(new.id::text, 1, 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
