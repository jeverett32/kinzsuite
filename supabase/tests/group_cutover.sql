-- ============================================================================
-- KinzSuite — Group cutover + helper tests
-- Run after migrations 0013+ and the latest cutover helper migration.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/group_cutover.sql
-- ============================================================================

begin;

do $$
declare
  inst uuid := '00000000-0000-0000-0000-000000000000';
  uid_owner uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  uid_member uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  uid_other uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  legacy_gid uuid;
  side_gid uuid := '33333333-3333-3333-3333-333333333333';
  join_gid uuid := '44444444-4444-4444-4444-444444444444';
  owner_group_after_leave uuid;
  chat_last_read_allows_null boolean;
  n int;
begin
  select is_nullable = 'YES'
  into chat_last_read_allows_null
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'chat_last_read'
    and column_name = 'group_id';

  truncate table
    public.message_reactions,
    public.chat_last_read,
    public.messages,
    public.daily_tasks,
    public.date_wheel_pick,
    public.wheel_quests,
    public.group_invites,
    public.group_members,
    public.groups,
    public.profiles
  cascade;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values
    (inst, uid_owner, 'authenticated', 'authenticated', 'owner@test.local',
     crypt('pw', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (inst, uid_member, 'authenticated', 'authenticated', 'member@test.local',
     crypt('pw', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, display_name)
  values (uid_owner, 'Owner'), (uid_member, 'Member')
  on conflict (id) do nothing;

  -- Legacy single-group rows start null-scoped.
  insert into public.messages (sender_id, content, group_id)
  values
    (uid_owner, 'legacy owner message', null),
    (uid_member, 'legacy member message', null);

  insert into public.daily_tasks (user_id, task_name, points, sort_order, group_id)
  values
    (uid_owner, 'legacy owner task', 1, 0, null),
    (uid_member, 'legacy member task', 1, 0, null);

  insert into public.wheel_quests (tag, title, detail, accent, sort_order, group_id)
  values
    ('LEGACY', 'Legacy quest', 'Legacy detail', 'sky', 0, null);

  insert into public.date_wheel_pick (id, accepted_quest_id, group_id)
  values (1, null, null)
  on conflict (id) do update set group_id = excluded.group_id;

  if chat_last_read_allows_null then
    insert into public.chat_last_read (user_id, last_read_at, group_id)
    values
      (uid_owner, now() - interval '1 hour', null),
      (uid_member, now() - interval '1 hour', null);
  end if;

  select public.backfill_legacy_group(
    p_group_name => 'Owner & Member',
    p_owner_user_id => uid_owner,
    p_member_user_ids => array[uid_owner, uid_member]
  ) into legacy_gid;

  if legacy_gid is null then
    raise exception 'FAIL: backfill_legacy_group returned null';
  end if;

  select count(*) into n from public.group_members where group_id = legacy_gid;
  if n <> 2 then
    raise exception 'FAIL: backfill should create 2 memberships (got %)', n;
  end if;

  select count(*) into n from public.messages where group_id = legacy_gid;
  if n <> 2 then
    raise exception 'FAIL: backfill should scope all legacy messages (got %)', n;
  end if;

  select count(*) into n from public.daily_tasks where group_id = legacy_gid;
  if n <> 20 then
    raise exception 'FAIL: backfill should scope all legacy tasks (got %)', n;
  end if;

  select count(*) into n from public.wheel_quests where group_id = legacy_gid;
  if n <> 1 then
    raise exception 'FAIL: backfill should scope all legacy quests (got %)', n;
  end if;

  select count(*) into n from public.date_wheel_pick where group_id = legacy_gid;
  if n <> 1 then
    raise exception 'FAIL: backfill should scope date wheel pick (got %)', n;
  end if;

  if chat_last_read_allows_null then
    select count(*) into n from public.chat_last_read where group_id = legacy_gid;
    if n <> 2 then
      raise exception 'FAIL: backfill should scope unread rows (got %)', n;
    end if;
  end if;

  select count(*) into n
  from public.profiles
  where id in (uid_owner, uid_member) and active_group_id = legacy_gid;
  if n <> 2 then
    raise exception 'FAIL: backfill should set both active groups (got %)', n;
  end if;

  begin
    perform public.backfill_legacy_group(
      p_group_name => 'Owner & Member',
      p_owner_user_id => uid_owner,
      p_member_user_ids => array[uid_owner, uid_member]
    );
    raise exception 'FAIL: guarded backfill should reject second run';
  exception
    when others then
      if position('already cut over' in sqlerrm) = 0 then
        raise;
      end if;
  end;

  insert into public.groups (id, name, created_by)
  values
    (side_gid, 'Side group', uid_owner),
    (join_gid, 'Join target', uid_member);

  insert into public.group_members (group_id, user_id, role, sort_order)
  values
    (side_gid, uid_owner, 'owner', 0),
    (join_gid, uid_member, 'owner', 0);

  update public.profiles set active_group_id = side_gid where id = uid_owner;

  insert into public.group_invites (code, group_id, created_by)
  values ('JOINME1234', join_gid, uid_member);

  perform set_config('request.jwt.claims', json_build_object('sub', uid_owner)::text, true);
  execute 'set local role authenticated';
  perform public.join_group_by_code('JOINME1234');

  select active_group_id into owner_group_after_leave
  from public.profiles
  where id = uid_owner;
  if owner_group_after_leave <> join_gid then
    raise exception 'FAIL: join_group_by_code should switch active group';
  end if;

  insert into public.chat_last_read (user_id, group_id, last_read_at)
  values (uid_owner, join_gid, now());

  perform public.leave_group(join_gid);

  select active_group_id into owner_group_after_leave
  from public.profiles
  where id = uid_owner;
  if owner_group_after_leave <> side_gid then
    raise exception 'FAIL: leave_group should switch active group to remaining membership';
  end if;

  select count(*) into n
  from public.chat_last_read
  where user_id = uid_owner and group_id = join_gid;
  if n <> 0 then
    raise exception 'FAIL: leave_group should remove old unread rows (got %)', n;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', uid_member)::text, true);
  execute 'set local role authenticated';
  delete from public.group_members
  where group_id = legacy_gid
    and user_id = uid_member;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FAIL: direct group_members delete should be blocked (got %)', n;
  end if;

  perform set_config('request.jwt.claims', json_build_object('sub', uid_owner)::text, true);
  execute 'set local role authenticated';
  begin
    perform public.leave_group(legacy_gid);
    raise exception 'FAIL: last owner should not leave group with remaining members';
  exception
    when others then
      if position('last owner' in sqlerrm) = 0 then
        raise;
      end if;
  end;

  raise notice 'PASS: all cutover helper tests succeeded';
end;
$$;

rollback;
