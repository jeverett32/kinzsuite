-- ============================================================================
-- KinzSuite — wheel_quests row count must match wheel slices (edit only).
-- ============================================================================

drop policy if exists "wheel_quests insert" on public.wheel_quests;
drop policy if exists "wheel_quests delete" on public.wheel_quests;
