-- ============================================================================
-- KinzSuite — shared wheel quests (Date tab) + CRUD on own daily_tasks
-- ============================================================================

-- ── 1. Wheel quests (shared by both partners; editable in Administration) ─
create table if not exists public.wheel_quests (
  id          uuid primary key default gen_random_uuid(),
  tag         text not null,
  title       text not null,
  detail      text not null,
  accent      text not null check (accent in ('sky', 'blush', 'sun', 'grass', 'purple')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists wheel_quests_sort_idx on public.wheel_quests (sort_order);

alter table public.wheel_quests enable row level security;

drop policy if exists "wheel_quests read" on public.wheel_quests;
drop policy if exists "wheel_quests insert" on public.wheel_quests;
drop policy if exists "wheel_quests update" on public.wheel_quests;
drop policy if exists "wheel_quests delete" on public.wheel_quests;

create policy "wheel_quests read"
  on public.wheel_quests for select
  to authenticated using (true);

create policy "wheel_quests insert"
  on public.wheel_quests for insert
  to authenticated with check (true);

create policy "wheel_quests update"
  on public.wheel_quests for update
  to authenticated using (true);

create policy "wheel_quests delete"
  on public.wheel_quests for delete
  to authenticated using (true);

insert into public.wheel_quests (tag, title, detail, accent, sort_order)
select v.tag, v.title, v.detail, v.accent, v.sort_order
from (values
  ('Arcade',    'Beat your high score in Cash Cow Returns', 'Loser owes the winner a backrub.', 'sun', 0),
  ('Garden',    'Plant a brand-new flowerbed together', 'Bonus: pick a color you''ve never used.', 'grass', 1),
  ('Cooking',   'Bake heart-shaped sugar cookies', 'Frost each other''s pet on top.', 'blush', 2),
  ('Adventure', 'Hike to a spot you''ve never visited', 'Take a polaroid for the gallery.', 'sky', 3),
  ('Cozy',      'Build a blanket fort and pick a movie', 'Loser of rock-paper-scissors picks snacks.', 'blush', 4),
  ('Music',     'Slow dance to one full song', 'No phones. Eye contact required.', 'sun', 5),
  ('Quest',     'Trade three pet outfits with each other', 'Style your partner''s pet for tomorrow.', 'grass', 6),
  ('Travel',    'Plan a 24-hr surprise trip on paper', 'Reveal at breakfast on Saturday.', 'sky', 7)
) as v(tag, title, detail, accent, sort_order)
where not exists (select 1 from public.wheel_quests);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'wheel_quests'
  ) then
    alter publication supabase_realtime add table public.wheel_quests;
  end if;
end $$;

-- ── 2. Per-user daily_tasks: allow insert / update / delete on own rows ───
--    (toggle_daily_task RPC remains for completions + points ledger.)
drop policy if exists "daily_tasks insert own" on public.daily_tasks;
drop policy if exists "daily_tasks update own" on public.daily_tasks;
drop policy if exists "daily_tasks delete own" on public.daily_tasks;

create policy "daily_tasks insert own"
  on public.daily_tasks for insert
  to authenticated with check (auth.uid() = user_id);

create policy "daily_tasks update own"
  on public.daily_tasks for update
  to authenticated using (auth.uid() = user_id);

create policy "daily_tasks delete own"
  on public.daily_tasks for delete
  to authenticated using (auth.uid() = user_id);
