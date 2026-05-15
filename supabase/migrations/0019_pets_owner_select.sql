-- ============================================================================
-- KinzSuite — Phase 3.5: pets owner-only SELECT
-- ============================================================================

drop policy if exists "pets readable by authed" on public.pets;
drop policy if exists "pets_select_owner" on public.pets;

create policy "pets_select_owner"
  on public.pets for select
  to authenticated
  using (auth.uid() = owner_id);
