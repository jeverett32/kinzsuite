-- ============================================================================
-- KinzSuite — Secure daily_log and toggle_daily_task
-- 1. Fix daily_log RLS to prevent cross-user data leakage.
-- 2. Update toggle_daily_task to populate group_id automatically.
-- ============================================================================

-- ── 1. Secure daily_log ─────────────────────────────────────────────────────
alter table public.daily_log enable row level security;

drop policy if exists "daily_log read by authed" on public.daily_log;
drop policy if exists "daily_log_select_group_member" on public.daily_log;

create policy "daily_log_select_group_member"
  on public.daily_log for select
  to authenticated
  using (
    -- You can see your own log
    auth.uid() = user_id
    or
    -- Or logs of people in your active group
    exists (
      select 1 
      from public.group_members gm
      where gm.user_id = daily_log.user_id
        and public.is_group_member(gm.group_id)
    )
  );

-- ── 2. Update toggle_daily_task ──────────────────────────────────────────────
create or replace function public.toggle_daily_task(task_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  t      public.daily_tasks%rowtype;
  today  date := current_date;
  done   boolean;
  ag_id  uuid;
begin
  select * into t from public.daily_tasks where id = task_id;
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
  if t.user_id is distinct from auth.uid() then
    raise exception 'Not your task' using errcode = '42501';
  end if;

  -- Get active group for backfilling group_id if needed
  select active_group_id into ag_id from public.profiles where id = auth.uid();

  done := (t.completed_at = today);

  if done then
    -- Undo today's completion
    update public.daily_tasks set completed_at = null where id = task_id;

    update public.daily_log
       set tasks_completed = tasks_completed - 1,
           points_earned   = points_earned - t.points
     where user_id = t.user_id and log_date = today;

    delete from public.daily_log
     where user_id = t.user_id
       and log_date = today
       and tasks_completed <= 0;

    update public.profiles
       set total_points = greatest(0, total_points - t.points)
     where id = t.user_id;
  else
    -- Mark complete (clearing any stale older date)
    -- Also ensure group_id is set if user is in a group
    update public.daily_tasks 
       set completed_at = today,
           group_id = coalesce(group_id, ag_id)
     where id = task_id;

    insert into public.daily_log (user_id, log_date, tasks_completed, points_earned)
    values (t.user_id, today, 1, t.points)
    on conflict (user_id, log_date) do update
      set tasks_completed = public.daily_log.tasks_completed + 1,
          points_earned   = public.daily_log.points_earned + t.points;

    update public.profiles
       set total_points = total_points + t.points
     where id = t.user_id;
  end if;
end;
$$;
