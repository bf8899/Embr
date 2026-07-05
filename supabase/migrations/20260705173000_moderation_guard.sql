-- Fix for the self-escalation guard. The previous migration's column-level
-- `revoke update (is_admin, suspended)` is ineffective: Supabase grants
-- table-level UPDATE to the app roles, and a table-level grant covers every
-- column regardless of a column-level revoke (has_column_privilege stays true).
--
-- Enforce it with a BEFORE UPDATE trigger instead. A non-admin caller can't
-- change is_admin/suspended — those fields are reset to their previous values,
-- so the rest of their profile update still applies. The admin-gated definer
-- functions run with the admin's auth.uid(), so current_user_is_admin() is true
-- and they can still flip the flags.

create function public.guard_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.is_admin is distinct from old.is_admin
       or new.suspended is distinct from old.suspended)
     and not public.current_user_is_admin() then
    new.is_admin := old.is_admin;
    new.suspended := old.suspended;
  end if;
  return new;
end;
$$;

create trigger guard_privileged_profile_columns
  before update on public.profiles
  for each row
  execute function public.guard_privileged_profile_columns();
