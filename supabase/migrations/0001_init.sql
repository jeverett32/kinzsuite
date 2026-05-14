-- ============================================================================
-- KinzSuite — initial schema
-- Paste this whole file into the Supabase SQL Editor and click Run.
-- Safe to re-run; everything is idempotent.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── profiles (one row per auth user) ────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── pets ────────────────────────────────────────────────────────────────────
create table if not exists public.pets (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  birthday   date,
  species    text,
  image_url  text,
  art_index  smallint not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists pets_owner_idx on public.pets(owner_id);

-- ── daily_tasks (shared between both partners) ──────────────────────────────
create table if not exists public.daily_tasks (
  id            uuid primary key default gen_random_uuid(),
  task_name     text not null,
  reward        text,
  assigned_to   text not null default 'both' check (assigned_to in ('me','partner','both')),
  completed_by  uuid references auth.users(id) on delete set null,
  completed_at  date,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists daily_tasks_sort_idx on public.daily_tasks(sort_order);

-- Nightly reset: clears `completed_by` / `completed_at` for tasks not done today.
create or replace function public.reset_stale_daily_tasks()
returns void
language sql
as $$
  update public.daily_tasks
     set completed_by = null,
         completed_at = null
   where completed_at is not null
     and completed_at < current_date;
$$;

-- ── messages ────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  sender_id  uuid not null references auth.users(id) on delete cascade,
  content    text,
  image_url  text,
  created_at timestamptz not null default now(),
  check (content is not null or image_url is not null)
);
create index if not exists messages_created_idx on public.messages(created_at desc);

-- ── Row-Level Security ──────────────────────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.pets        enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.messages    enable row level security;

-- Profiles: every authenticated user can read every profile (so you can see
-- your partner's display name); each user can update only their own row.
drop policy if exists "profiles readable by authed" on public.profiles;
create policy "profiles readable by authed"
  on public.profiles for select
  to authenticated using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- Pets: any authed user can see all pets (it's a shared app for two people);
-- only the owner can insert / update / delete their own pets.
drop policy if exists "pets readable by authed" on public.pets;
create policy "pets readable by authed"
  on public.pets for select
  to authenticated using (true);

drop policy if exists "pets insert own" on public.pets;
create policy "pets insert own"
  on public.pets for insert
  to authenticated with check (auth.uid() = owner_id);

drop policy if exists "pets update own" on public.pets;
create policy "pets update own"
  on public.pets for update
  to authenticated using (auth.uid() = owner_id);

drop policy if exists "pets delete own" on public.pets;
create policy "pets delete own"
  on public.pets for delete
  to authenticated using (auth.uid() = owner_id);

-- Daily tasks: shared — any authed user can read and toggle.
drop policy if exists "tasks readable by authed" on public.daily_tasks;
create policy "tasks readable by authed"
  on public.daily_tasks for select
  to authenticated using (true);

drop policy if exists "tasks insert by authed" on public.daily_tasks;
create policy "tasks insert by authed"
  on public.daily_tasks for insert
  to authenticated with check (true);

drop policy if exists "tasks update by authed" on public.daily_tasks;
create policy "tasks update by authed"
  on public.daily_tasks for update
  to authenticated using (true);

drop policy if exists "tasks delete by authed" on public.daily_tasks;
create policy "tasks delete by authed"
  on public.daily_tasks for delete
  to authenticated using (true);

-- Messages: any authed user can read; only sender can insert as themselves.
drop policy if exists "messages readable by authed" on public.messages;
create policy "messages readable by authed"
  on public.messages for select
  to authenticated using (true);

drop policy if exists "messages insert as self" on public.messages;
create policy "messages insert as self"
  on public.messages for insert
  to authenticated with check (auth.uid() = sender_id);

drop policy if exists "messages delete own" on public.messages;
create policy "messages delete own"
  on public.messages for delete
  to authenticated using (auth.uid() = sender_id);

-- ── Realtime publication ────────────────────────────────────────────────────
-- Add tables to the supabase_realtime publication so the app can subscribe.
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
     where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'pets'
  ) then
    alter publication supabase_realtime add table public.pets;
  end if;
end $$;

-- ── Seed daily tasks (only if table is empty) ───────────────────────────────
insert into public.daily_tasks (task_name, reward, assigned_to, sort_order)
select * from (values
  ('Wheel of Wow',     '+250 ★',     'both',    0),
  ('Gem Hunt',         '+3 gems',    'me',      1),
  ('Feed all pets',    '+1 ❤︎',      'both',    2),
  ('Water the garden', '+50 ★',      'partner', 3),
  ('Daily Kinz Quiz',  '+1 trophy',  'me',      4),
  ('Tuck pets in',     '+1 ❤︎',      'both',    5)
) as v(task_name, reward, assigned_to, sort_order)
where not exists (select 1 from public.daily_tasks);
