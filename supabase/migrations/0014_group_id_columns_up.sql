-- ============================================================================
-- KinzSuite — Add group_id columns
-- Phase 1.2 & 1.3
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. Add group_id to existing shared tables ───────────────────────────────
alter table public.messages 
  add column if not exists group_id uuid references public.groups(id);

alter table public.daily_tasks 
  add column if not exists group_id uuid references public.groups(id);

alter table public.date_wheel_pick 
  add column if not exists group_id uuid references public.groups(id);

alter table public.wheel_quests 
  add column if not exists group_id uuid references public.groups(id);

-- ── 2. Create chat_last_read table and add group_id ─────────────────────────
-- (Currently chat_last_read_at is a column on profiles. The plan treats it as
-- a shared table to be keyed by user_id and group_id.)
create table if not exists public.chat_last_read (
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now()
);

alter table public.chat_last_read 
  add column if not exists group_id uuid references public.groups(id);

-- ── 3. Add active_group_id to profiles ──────────────────────────────────────
alter table public.profiles 
  add column if not exists active_group_id uuid references public.groups(id);
