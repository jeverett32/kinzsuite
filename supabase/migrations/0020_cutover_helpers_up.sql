-- ============================================================================
-- KinzSuite — Cutover helpers and group leave flow
-- Phase 4 + Phase 6 cleanup
-- ============================================================================

-- ── 1. create_group: new group becomes active group ─────────────────────────
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

  insert into public.groups (name, created_by)
  values (p_name, uid)
  returning id into new_gid;

  insert into public.group_members (group_id, user_id, role, sort_order)
  values (new_gid, uid, 'owner', 0);

  new_code := public.generate_invite_code();
  insert into public.group_invites (code, group_id, created_by, expires_at)
  values (new_code, new_gid, uid, now() + interval '7 days');

  update public.profiles
  set active_group_id = new_gid
  where id = uid;

  return query select new_gid, new_code;
end;
$$;

revoke all on function public.create_group(text) from public;
grant execute on function public.create_group(text) to authenticated;

-- ── 2. join_group_by_code: joined group becomes active group ────────────────
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

  if exists (
    select 1 from public.group_members
    where group_id = invite.group_id and user_id = uid
  ) then
    raise exception 'already member' using errcode = '23505';
  end if;

  select coalesce(max(sort_order), 0) + 1 into new_sort
  from public.group_members
  where group_id = invite.group_id;

  insert into public.group_members (group_id, user_id, role, sort_order)
  values (invite.group_id, uid, 'member', new_sort);

  if invite.uses_remaining is not null then
    update public.group_invites
    set uses_remaining = uses_remaining - 1
    where code = p_code;
  end if;

  update public.profiles
  set active_group_id = invite.group_id
  where id = uid;

  return invite.group_id;
end;
$$;

revoke all on function public.join_group_by_code(text) from public;
grant execute on function public.join_group_by_code(text) to authenticated;

-- ── 3. group_members: direct deletes must go through leave_group ────────────
drop policy if exists "group_members_delete_owner" on public.group_members;
drop policy if exists "group_members_delete_self" on public.group_members;

-- ── 4. leave_group: guard owners, clean unread, switch active group ─────────
create or replace function public.leave_group(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  current_active_group_id uuid;
  next_group_id uuid;
  has_membership boolean;
  is_owner boolean;
  other_member_count int;
  other_owner_count int;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select active_group_id into current_active_group_id
  from public.profiles
  where id = uid;

  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = uid
  ) into has_membership;

  if not has_membership then
    raise exception 'not a member of this group' using errcode = 'P0002';
  end if;

  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = uid
      and role = 'owner'
  ) into is_owner;

  select count(*) into other_member_count
  from public.group_members
  where group_id = p_group_id
    and user_id <> uid;

  if other_member_count = 0 then
    raise exception 'cannot leave the only member of a group';
  end if;

  if is_owner then
    select count(*) into other_owner_count
    from public.group_members
    where group_id = p_group_id
      and user_id <> uid
      and role = 'owner';

    if other_owner_count = 0 then
      raise exception 'last owner cannot leave group with remaining members';
    end if;
  end if;

  delete from public.chat_last_read
  where user_id = uid
    and group_id = p_group_id;

  delete from public.group_members
  where group_id = p_group_id
    and user_id = uid;

  select gm.group_id into next_group_id
  from public.group_members gm
  where gm.user_id = uid
  order by gm.sort_order asc, gm.joined_at asc, gm.group_id asc
  limit 1;

  if current_active_group_id = p_group_id then
    update public.profiles
    set active_group_id = next_group_id
    where id = uid;
    return next_group_id;
  end if;

  return current_active_group_id;
end;
$$;

revoke all on function public.leave_group(uuid) from public;
grant execute on function public.leave_group(uuid) to authenticated;

-- ── 5. backfill_legacy_group: one-shot prod cutover helper ──────────────────
create or replace function public.backfill_legacy_group(
  p_group_name text,
  p_owner_user_id uuid,
  p_member_user_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_gid uuid;
  target_user_ids uuid[];
  profile_count int;
begin
  if p_owner_user_id is null then
    raise exception 'owner user id is required';
  end if;

  select coalesce(array_agg(member_id order by min_sort_rank, member_id), '{}'::uuid[])
    into target_user_ids
  from (
    select member_id, min(sort_rank) as min_sort_rank
    from (
      select p_owner_user_id as member_id, 0 as sort_rank
      union all
      select unnest(coalesce(p_member_user_ids, '{}'::uuid[])) as member_id, 1 as sort_rank
    ) ids
    where member_id is not null
    group by member_id
  ) deduped;

  if cardinality(target_user_ids) = 0 then
    raise exception 'at least one member user id is required';
  end if;

  select count(*) into profile_count
  from public.profiles
  where id = any(target_user_ids);

  if profile_count <> cardinality(target_user_ids) then
    raise exception 'all target users must have profiles before cutover';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = any(target_user_ids)
      and active_group_id is not null
  ) or exists (
    select 1
    from public.group_members
    where user_id = any(target_user_ids)
  ) or exists (
    select 1 from public.messages where group_id is not null
    union all
    select 1 from public.daily_tasks where group_id is not null
    union all
    select 1 from public.date_wheel_pick where group_id is not null
    union all
    select 1 from public.wheel_quests where group_id is not null
    union all
    select 1 from public.chat_last_read where group_id is not null
  ) then
    raise exception 'already cut over: legacy shared rows or memberships already scoped';
  end if;

  if exists (
    select 1
    from public.messages
    where group_id is null
      and not (sender_id = any(target_user_ids))
  ) then
    raise exception 'legacy messages include senders outside target users';
  end if;

  if exists (
    select 1
    from public.daily_tasks
    where group_id is null
      and not (user_id = any(target_user_ids))
  ) then
    raise exception 'legacy tasks include owners outside target users';
  end if;

  if exists (
    select 1
    from public.chat_last_read
    where group_id is null
      and not (user_id = any(target_user_ids))
  ) then
    raise exception 'legacy unread rows include users outside target users';
  end if;

  insert into public.groups (name, created_by)
  values (coalesce(nullif(trim(p_group_name), ''), 'My group'), p_owner_user_id)
  returning id into new_gid;

  insert into public.group_members (group_id, user_id, role, sort_order)
  select
    new_gid,
    member_id,
    case when member_id = p_owner_user_id then 'owner' else 'member' end,
    ordinality - 1
  from unnest(target_user_ids) with ordinality as member(member_id, ordinality);

  update public.profiles
  set active_group_id = new_gid
  where id = any(target_user_ids);

  update public.messages
  set group_id = new_gid
  where group_id is null;

  update public.daily_tasks
  set group_id = new_gid
  where group_id is null;

  update public.date_wheel_pick
  set group_id = new_gid
  where group_id is null;

  update public.wheel_quests
  set group_id = new_gid
  where group_id is null;

  update public.chat_last_read
  set group_id = new_gid
  where group_id is null;

  return new_gid;
end;
$$;

revoke all on function public.backfill_legacy_group(text, uuid, uuid[]) from public;
