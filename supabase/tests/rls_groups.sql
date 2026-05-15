-- ============================================================================
-- KinzSuite — RLS group membership tests
-- Run after migrations 0013–0017 on a branch / local DB.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_groups.sql
-- ============================================================================

begin;

create schema if not exists _rls_test;

create or replace function _rls_test.set_auth(p_uid uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid)::text, true);
  execute 'set local role authenticated';
end;
$$;

do $$
declare
  inst   uuid := '00000000-0000-0000-0000-000000000000';
  uid_a  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  uid_b  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  uid_c  uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  g1     uuid := '11111111-1111-1111-1111-111111111111';
  g2     uuid := '22222222-2222-2222-2222-222222222222';
  msg_g1 uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  msg_g2 uuid := 'aaaaaaaa-0002-0002-0002-000000000002';
  task_a_g1 uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  pet_a  uuid := 'cccccccc-0001-0001-0001-000000000001';
  n      int;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  values
    (inst, uid_a, 'authenticated', 'authenticated', 'rls-a@test.local',
     crypt('pw', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (inst, uid_b, 'authenticated', 'authenticated', 'rls-b@test.local',
     crypt('pw', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (inst, uid_c, 'authenticated', 'authenticated', 'rls-c@test.local',
     crypt('pw', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, display_name)
  values (uid_a, 'A'), (uid_b, 'B'), (uid_c, 'C')
  on conflict (id) do nothing;

  insert into public.groups (id, name, created_by)
  values
    (g1, 'G1', uid_a),
    (g2, 'G2', uid_a);

  insert into public.group_members (group_id, user_id, role, sort_order)
  values
    (g1, uid_a, 'owner', 0),
    (g1, uid_b, 'member', 1),
    (g2, uid_a, 'owner', 0),
    (g2, uid_c, 'member', 1);

  update public.profiles set active_group_id = g1 where id in (uid_a, uid_b);
  update public.profiles set active_group_id = g2 where id = uid_c;

  insert into public.messages (id, sender_id, content, group_id)
  values
    (msg_g1, uid_a, 'hello G1', g1),
    (msg_g2, uid_a, 'hello G2', g2);

  insert into public.daily_tasks (id, user_id, task_name, points, sort_order, group_id)
  values (task_a_g1, uid_a, 'A task G1', 1, 0, g1);

  insert into public.pets (id, owner_id, name)
  values (pet_a, uid_a, 'Fluffy');

  -- B cannot SELECT G2 messages
  perform _rls_test.set_auth(uid_b);
  select count(*) into n from public.messages where group_id = g2;
  if n <> 0 then
    raise exception 'FAIL: B should not SELECT G2 messages (got %)', n;
  end if;

  select count(*) into n from public.messages where group_id = g1;
  if n <> 1 then
    raise exception 'FAIL: B should see one G1 message (got %)', n;
  end if;

  -- C cannot UPDATE A's task in G1
  perform _rls_test.set_auth(uid_c);
  update public.daily_tasks set task_name = 'hacked' where id = task_a_g1;
  get diagnostics n = row_count;
  if n > 0 then
    raise exception 'FAIL: C updated A task in G1';
  end if;

  -- Active group: app filters by profiles.active_group_id
  perform _rls_test.set_auth(uid_a);
  update public.profiles set active_group_id = g1 where id = uid_a;

  select count(*) into n
    from public.messages m
   where m.group_id = (select active_group_id from public.profiles where id = uid_a);
  if n <> 1 then
    raise exception 'FAIL: A active G1 should see 1 message (got %)', n;
  end if;

  select count(*) into n
    from public.messages m
   where m.group_id = g2
     and m.group_id = (select active_group_id from public.profiles where id = uid_a);
  if n <> 0 then
    raise exception 'FAIL: A active G1 should not match G2 via active filter';
  end if;

  update public.profiles set active_group_id = g2 where id = uid_a;

  select count(*) into n
    from public.messages m
   where m.group_id = (select active_group_id from public.profiles where id = uid_a);
  if n <> 1 then
    raise exception 'FAIL: A active G2 should see 1 message (got %)', n;
  end if;

  select count(*) into n
    from public.messages m
   where m.group_id = g1
     and m.group_id = (select active_group_id from public.profiles where id = uid_a);
  if n <> 0 then
    raise exception 'FAIL: A active G2 should not match G1 via active filter';
  end if;

  -- RLS membership: A sees both groups without active filter
  select count(*) into n from public.messages;
  if n < 2 then
    raise exception 'FAIL: A should see both groups under RLS (got %)', n;
  end if;

  -- Pets: owner mutations only (policies unchanged from 0001)
  perform _rls_test.set_auth(uid_b);
  update public.pets set name = 'stolen' where id = pet_a;
  get diagnostics n = row_count;
  if n > 0 then
    raise exception 'FAIL: B should not UPDATE A pet';
  end if;

  perform _rls_test.set_auth(uid_a);
  select count(*) into n from public.pets where owner_id = uid_a;
  if n <> 1 then
    raise exception 'FAIL: A should see own pet (got %)', n;
  end if;

  perform _rls_test.set_auth(uid_b);
  delete from public.pets where id = pet_a;
  get diagnostics n = row_count;
  if n > 0 then
    raise exception 'FAIL: B should not DELETE A pet';
  end if;

  raise notice 'PASS: all RLS group tests succeeded';
end;
$$;

rollback;

drop function if exists _rls_test.set_auth(uuid);
drop schema if exists _rls_test cascade;
