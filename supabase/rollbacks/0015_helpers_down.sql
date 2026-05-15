-- ============================================================================
-- KinzSuite — Helpers (Down)
-- ============================================================================

drop function if exists public.generate_invite_code();
drop function if exists public.get_group_members(uuid);
drop function if exists public.current_active_group();
drop function if exists public.is_group_member(uuid);
