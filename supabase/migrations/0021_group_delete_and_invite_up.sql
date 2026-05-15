-- ============================================================================
-- KinzSuite — Delete group (owner) + shareable invite helper
-- ============================================================================

-- ── 1. get_or_create_group_invite ───────────────────────────────────────────
create or replace function public.get_or_create_group_invite(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  existing_code text;
  new_code text;
  is_owner boolean;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'not a member of this group' using errcode = 'P0002';
  end if;

  select gi.code into existing_code
  from public.group_invites gi
  where gi.group_id = p_group_id
    and gi.revoked_at is null
    and (gi.expires_at is null or gi.expires_at > now())
    and (gi.uses_remaining is null or gi.uses_remaining > 0)
  order by gi.created_at desc
  limit 1;

  if existing_code is not null then
    return existing_code;
  end if;

  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = uid
      and role = 'owner'
  ) into is_owner;

  if not is_owner then
    raise exception 'no active invite code; ask a group owner for a new one' using errcode = 'P0002';
  end if;

  new_code := public.generate_invite_code();
  insert into public.group_invites (code, group_id, created_by, expires_at)
  values (new_code, p_group_id, uid, now() + interval '7 days');

  return new_code;
end;
$$;

revoke all on function public.get_or_create_group_invite(uuid) from public;
grant execute on function public.get_or_create_group_invite(uuid) to authenticated;

-- ── 2. delete_group ───────────────────────────────────────────────────────────
create or replace function public.delete_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  is_owner boolean;
begin
  if uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = uid
      and role = 'owner'
  ) into is_owner;

  if not is_owner then
    raise exception 'only a group owner can delete the group' using errcode = '42501';
  end if;

  update public.profiles
  set active_group_id = null
  where active_group_id = p_group_id;

  delete from public.chat_last_read
  where group_id = p_group_id;

  delete from public.message_reactions mr
  using public.messages m
  where m.id = mr.message_id
    and m.group_id = p_group_id;

  delete from public.messages
  where group_id = p_group_id;

  delete from public.daily_tasks
  where group_id = p_group_id;

  delete from public.wheel_quests
  where group_id = p_group_id;

  delete from public.date_wheel_pick
  where group_id = p_group_id;

  delete from public.groups
  where id = p_group_id;
end;
$$;

revoke all on function public.delete_group(uuid) from public;
grant execute on function public.delete_group(uuid) to authenticated;
