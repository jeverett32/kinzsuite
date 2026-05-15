-- ============================================================================
-- KinzSuite — Phase 3.5 rollback: restore global pets SELECT from 0001_init.sql
-- ============================================================================

drop policy if exists "pets_select_owner" on public.pets;

drop policy if exists "pets readable by authed" on public.pets;
create policy "pets readable by authed"
  on public.pets for select
  to authenticated using (true);
