\set ON_ERROR_STOP 1

-- Usage:
--   psql "$DATABASE_URL" \
--     -v owner_user_id="'00000000-0000-0000-0000-000000000000'" \
--     -v member_user_ids="'{00000000-0000-0000-0000-000000000000,11111111-1111-1111-1111-111111111111}'" \
--     -v group_name="'John & Cam'" \
--     -f scripts/backfill-legacy-group.sql
--
-- Guarded one-shot cutover for legacy null-scoped shared rows.

begin;

select public.backfill_legacy_group(
  p_group_name => :group_name,
  p_owner_user_id => :owner_user_id::uuid,
  p_member_user_ids => :member_user_ids::uuid[]
) as group_id;

select 'messages' as table_name, count(*) as row_count
from public.messages
where group_id is not null
union all
select 'daily_tasks', count(*)
from public.daily_tasks
where group_id is not null
union all
select 'date_wheel_pick', count(*)
from public.date_wheel_pick
where group_id is not null
union all
select 'wheel_quests', count(*)
from public.wheel_quests
where group_id is not null
union all
select 'chat_last_read', count(*)
from public.chat_last_read
where group_id is not null;

commit;
