-- 0016_remove_two_user_limit_down.sql
-- Reinstall the two-user limit function and trigger exactly as before (rollback)

-- ============================================================================
-- KinzSuite — hard cap auth.users at 2 rows.
--
-- This is a backstop in addition to disabling signups in the Supabase
-- dashboard (Authentication → Settings → "Allow new users to sign up" = OFF).
-- Even if signups get re-enabled by accident, a third user can't be created.
--
-- Idempotent — safe to re-run.
-- ============================================================================

create or replace function public.enforce_two_user_max()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from auth.users) >= 2 then
    raise exception 'KinzSuite is limited to 2 users. Disable this trigger to add more.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_two_user_max on auth.users;
create trigger enforce_two_user_max
  before insert on auth.users
  for each row execute procedure public.enforce_two_user_max();
