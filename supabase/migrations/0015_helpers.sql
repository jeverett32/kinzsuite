-- ============================================================================
-- KinzSuite — Helpers
-- Phase 1.4
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. is_group_member ──────────────────────────────────────────────────────
create or replace function public.is_group_member(gid uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return exists (
    select 1
    from public.group_members
    where group_id = gid
      and user_id = auth.uid()
  );
end;
$$;
revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;

-- ── 2. current_active_group ─────────────────────────────────────────────────
create or replace function public.current_active_group()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  ag_id uuid;
begin
  select active_group_id into ag_id
  from public.profiles
  where id = auth.uid();
  
  return ag_id;
end;
$$;
revoke all on function public.current_active_group() from public;
grant execute on function public.current_active_group() to authenticated;

-- ── 3. get_group_members ────────────────────────────────────────────────────
create or replace function public.get_group_members(gid uuid)
returns table (
  user_id uuid,
  role text,
  sort_order int,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select gm.user_id, gm.role, gm.sort_order, gm.joined_at
  from public.group_members gm
  where gm.group_id = gid
  order by
    case when gm.user_id = auth.uid() then 0 else 1 end,
    gm.sort_order asc,
    gm.joined_at asc;
end;
$$;
revoke all on function public.get_group_members(uuid) from public;
grant execute on function public.get_group_members(uuid) to authenticated;

-- ── 4. generate_invite_code ─────────────────────────────────────────────────
create or replace function public.generate_invite_code()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i int;
  attempts int := 0;
  max_attempts int := 5;
  code_exists boolean;
begin
  loop
    result := '';
    for i in 1..10 loop
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    
    select exists(select 1 from public.group_invites where code = result) into code_exists;
    if not code_exists then
      return result;
    end if;
    
    attempts := attempts + 1;
    if attempts >= max_attempts then
      raise exception 'Failed to generate unique invite code after % attempts', max_attempts;
    end if;
  end loop;
end;
$$;
revoke all on function public.generate_invite_code() from public;
grant execute on function public.generate_invite_code() to authenticated;
