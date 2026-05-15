-- ============================================================================
-- KinzSuite — Multi-User Groups: Core Tables
-- Phase 1.1: groups, group_members, group_invites
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. groups ───────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ── 2. group_members ────────────────────────────────────────────────────────
create table if not exists public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  sort_order int not null default 0,
  primary key (group_id, user_id)
);

create index if not exists group_members_user_group_idx on public.group_members (user_id, group_id);
-- (group_id, user_id) is already covered by the primary key index.

-- ── 3. group_invites ────────────────────────────────────────────────────────
create table if not exists public.group_invites (
  code           text primary key,
  group_id       uuid not null references public.groups(id) on delete cascade,
  created_by     uuid not null references auth.users(id),
  expires_at     timestamptz,
  revoked_at     timestamptz,
  uses_remaining int,
  created_at     timestamptz not null default now()
);

create index if not exists group_invites_group_idx on public.group_invites (group_id);
