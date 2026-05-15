-- Fix function signature to accept client-provided date
drop function if exists public.toggle_daily_task(uuid);

create or replace function public.toggle_daily_task(task_id uuid, local_date_iso text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t      public.daily_tasks%rowtype;
  today  date;
  done   boolean;
begin
  if local_date_iso is null then
    today := current_date;
  else
    today := local_date_iso::date;
  end if;

  select * into t from public.daily_tasks where id = task_id;
  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
  if t.user_id is distinct from auth.uid() then
    raise exception 'Not your task' using errcode = '42501';
  end if;

  done := (t.completed_at = today);

  if done then
    -- Undo today completion
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
    -- Mark complete
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

grant execute on function public.toggle_daily_task(uuid, text) to authenticated;
