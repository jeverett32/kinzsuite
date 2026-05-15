-- ============================================================================
-- KinzSuite — Atomic Group Helpers
-- Phase 1.5
-- Idempotent — safe to re-run.
-- ============================================================================

-- ── 1. create_group ──────────────────────────────────────────────────────────
create or replace function public.create_group(p_name text)
returns table(group_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_gid uuid;
  new_code text;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- 1. Create the group
  insert into public.groups (name, created_by)
  values (p_name, uid)
  returning id into new_gid;

  -- 2. Add creator as owner
  insert into public.group_members (group_id, user_id, role, sort_order)
  values (new_gid, uid, 'owner', 0);

  -- 3. Generate initial invite code (7-day expiry)
  new_code := public.generate_invite_code();
  insert into public.group_invites (code, group_id, created_by, expires_at)
  values (new_code, new_gid, uid, now() + interval '7 days');

  -- 4. Set as active group if none set
  update public.profiles
  set active_group_id = new_gid
  where id = uid and active_group_id is null;

  return query select new_gid, new_code;
end;
$$;

revoke all on function public.create_group(text) from public;
grant execute on function public.create_group(text) to authenticated;

-- ── 2. join_group_by_code ────────────────────────────────────────────────────
create or replace function public.join_group_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invite record;
  new_sort int;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- 1. Look up and validate invite
  select * into invite
  from public.group_invites
  where code = p_code;

  if not found then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;

  if invite.revoked_at is not null then
    raise exception 'invite revoked' using errcode = 'P0002';
  end if;

  if invite.expires_at is not null and invite.expires_at < now() then
    raise exception 'invite expired' using errcode = 'P0002';
  end if;

  if invite.uses_remaining is not null and invite.uses_remaining <= 0 then
    raise exception 'no uses remaining' using errcode = 'P0002';
  end if;

  -- 2. Check if already a member
  if exists (
    select 1 from public.group_members
    where group_id = invite.group_id and user_id = uid
  ) then
    raise exception 'already member' using errcode = '23505';
  end if;

  -- 3. Determine sort order
  select coalesce(max(sort_order), 0) + 1 into new_sort
  from public.group_members
  where group_id = invite.group_id;

  -- 4. Join group
  insert into public.group_members (group_id, user_id, role, sort_order)
  values (invite.group_id, uid, 'member', new_sort);

  -- 5. Decrement uses if applicable
  if invite.uses_remaining is not null then
    update public.group_invites
    set uses_remaining = uses_remaining - 1
    where code = p_code;
  end if;

  -- 6. Set as active group if none set
  update public.profiles
  set active_group_id = invite.group_id
  where id = uid and active_group_id is null;

  return invite.group_id;
end;
$$;

revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;
