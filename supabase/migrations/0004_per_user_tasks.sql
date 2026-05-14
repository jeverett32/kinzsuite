-- ============================================================================
-- KinzSuite — per-user daily tasks, points, and streaks.
--
-- Each user gets their own copy of the daily task list. Toggling a task is
-- done via the toggle_daily_task() RPC which atomically updates the task,
-- the daily_log ledger, and the user's lifetime point total.
--
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. Replace daily_tasks ──────────────────────────────────────────────────
drop function if exists public.reset_stale_daily_tasks() cascade;
drop table if exists public.daily_tasks cascade;

create table public.daily_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  task_name   text not null,
  points      int  not null default 1,
  completed_at date,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index daily_tasks_user_idx on public.daily_tasks(user_id);

-- ── 2. daily_log: one row per (user, date) with >=1 completed task ─────────
create table if not exists public.daily_log (
  user_id         uuid references auth.users(id) on delete cascade,
  log_date        date not null,
  tasks_completed int  not null default 0 check (tasks_completed >= 0),
  points_earned   int  not null default 0 check (points_earned >= 0),
  primary key (user_id, log_date)
);
create index if not exists daily_log_date_idx on public.daily_log(user_id, log_date desc);

-- ── 3. profiles.total_points ───────────────────────────────────────────────
alter table public.profiles
  add column if not exists total_points int not null default 0;

-- ── 4. Seed function ───────────────────────────────────────────────────────
create or replace function public.seed_daily_tasks(uid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.daily_tasks (user_id, task_name, points, sort_order)
  select uid, t.name, t.points, t.sort
    from (values
      ('Wheel of WOW',              2, 0),
      ('Wishing Well 2',             2, 1),
      ('Wish of the Day',            2, 2),
      ('Spree',                      3, 3),
      ('Gem Hunt',                   5, 4),
      ('Kinzville Academy',         13, 5),
      ('Employment Office',          8, 6),
      ('Mobile App - Wheel of WOW',  3, 7),
      ('Send a Letter',              3, 8)
    ) as t(name, points, sort)
   where not exists (
     select 1 from public.daily_tasks dt where dt.user_id = uid
   );
$$;

-- ── 5. Update handle_new_user to also seed tasks ───────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  perform public.seed_daily_tasks(new.id);

  return new;
end;
$$;

-- ── 6. Backfill: seed tasks for existing users ─────────────────────────────
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public.seed_daily_tasks(u.id);
  end loop;
end $$;

-- ── 7. Toggle RPC ──────────────────────────────────────────────────────────
create or replace function public.toggle_daily_task(task_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t      public.daily_tasks%rowtype;
  today  date := current_date;
  done   boolean;
begin
  select * into t from public.daily_tasks where id = task_id;
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
  if t.user_id is distinct from auth.uid() then
    raise exception 'Not your task' using errcode = '42501';
  end if;

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
    update public.daily_tasks set completed_at = today where id = task_id;

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

revoke all on function public.toggle_daily_task(uuid) from public;
grant execute on function public.toggle_daily_task(uuid) to authenticated;

-- ── 8. Server-side stale-task reset (clears yesterday's checks) ────────────
--    The toggle function also handles stale state when you check a task
--    today; this function is for a daily cron if you want one.
create or replace function public.reset_stale_daily_tasks()
returns void
language sql
as $$
  update public.daily_tasks
     set completed_at = null
   where completed_at is not null
     and completed_at < current_date;
$$;

-- ── 9. RLS ─────────────────────────────────────────────────────────────────
alter table public.daily_tasks enable row level security;
alter table public.daily_log   enable row level security;

drop policy if exists "tasks readable by authed" on public.daily_tasks;
drop policy if exists "tasks insert by authed"   on public.daily_tasks;
drop policy if exists "tasks update by authed"   on public.daily_tasks;
drop policy if exists "tasks delete by authed"   on public.daily_tasks;
drop policy if exists "daily_tasks read by authed" on public.daily_tasks;

create policy "daily_tasks read by authed"
  on public.daily_tasks for select
  to authenticated using (true);

-- No direct INSERT/UPDATE/DELETE policies — clients must use the toggle RPC
-- (which is SECURITY DEFINER and bypasses RLS internally).

drop policy if exists "daily_log read by authed" on public.daily_log;
create policy "daily_log read by authed"
  on public.daily_log for select
  to authenticated using (true);

-- ── 10. Realtime publication ───────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'daily_tasks'
  ) then
    alter publication supabase_realtime add table public.daily_tasks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'daily_log'
  ) then
    alter publication supabase_realtime add table public.daily_log;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
