-- ============================================================================
-- KinzSuite — shared accepted date-wheel quest (both partners see the same)
-- ============================================================================

create table if not exists public.date_wheel_pick (
  id int primary key check (id = 1),
  accepted_quest_id uuid references public.wheel_quests (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.date_wheel_pick (id, accepted_quest_id)
values (1, null)
on conflict (id) do nothing;

alter table public.date_wheel_pick enable row level security;

drop policy if exists "date_wheel_pick read" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick update" on public.date_wheel_pick;

create policy "date_wheel_pick read"
  on public.date_wheel_pick for select
  to authenticated using (true);

create policy "date_wheel_pick update"
  on public.date_wheel_pick for update
  to authenticated using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'date_wheel_pick'
  ) then
    alter publication supabase_realtime add table public.date_wheel_pick;
  end if;
end $$;
