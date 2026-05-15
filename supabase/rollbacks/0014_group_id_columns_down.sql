-- ============================================================================
-- KinzSuite — Drop group_id columns (Down)
-- ============================================================================

alter table public.profiles drop column if exists active_group_id;

-- Drop chat_last_read entirely since it was created in this phase
drop table if exists public.chat_last_read;

alter table public.wheel_quests drop column if exists group_id;
alter table public.date_wheel_pick drop column if exists group_id;
alter table public.daily_tasks drop column if exists group_id;
alter table public.messages drop column if exists group_id;
