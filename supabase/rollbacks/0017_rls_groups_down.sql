-- ============================================================================
-- KinzSuite — Phase 3 RLS rollback (restore pre-0017 policies exactly)
-- ============================================================================

drop function if exists public.redeem_invite(text);

-- ── group_invites / group_members / groups (0017 policies only) ───────────────
drop policy if exists "group_invites_select_group_member" on public.group_invites;
drop policy if exists "group_invites_insert_group_member" on public.group_invites;
drop policy if exists "group_invites_update_group_member" on public.group_invites;
drop policy if exists "group_invites_delete_group_member" on public.group_invites;

drop policy if exists "group_members_select_group_member" on public.group_members;
drop policy if exists "group_members_insert_group_member" on public.group_members;
drop policy if exists "group_members_update_group_member" on public.group_members;
drop policy if exists "group_members_delete_group_member" on public.group_members;
drop policy if exists "group_members_delete_owner" on public.group_members;
drop policy if exists "group_members_delete_self" on public.group_members;

drop policy if exists "groups_select_group_member" on public.groups;
drop policy if exists "groups_insert_group_member" on public.groups;
drop policy if exists "groups_update_group_member" on public.groups;
drop policy if exists "groups_delete_group_member" on public.groups;

-- ── message_reactions (restore 0012) ──────────────────────────────────────────
drop policy if exists "message_reactions_select_group_member" on public.message_reactions;
drop policy if exists "message_reactions_insert_group_member" on public.message_reactions;
drop policy if exists "message_reactions_update_group_member" on public.message_reactions;
drop policy if exists "message_reactions_delete_group_member" on public.message_reactions;

drop policy if exists "reactions readable by authed" on public.message_reactions;
create policy "reactions readable by authed"
  on public.message_reactions for select
  to authenticated using (true);

drop policy if exists "reactions insert as self" on public.message_reactions;
create policy "reactions insert as self"
  on public.message_reactions for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "reactions update own" on public.message_reactions;
create policy "reactions update own"
  on public.message_reactions for update
  to authenticated using (auth.uid() = user_id);

drop policy if exists "reactions delete own" on public.message_reactions;
create policy "reactions delete own"
  on public.message_reactions for delete
  to authenticated using (auth.uid() = user_id);

-- ── chat_last_read (0017 only; table removed by 0014 down) ───────────────────
drop policy if exists "chat_last_read_select_group_member" on public.chat_last_read;
drop policy if exists "chat_last_read_insert_group_member" on public.chat_last_read;
drop policy if exists "chat_last_read_update_group_member" on public.chat_last_read;
drop policy if exists "chat_last_read_delete_group_member" on public.chat_last_read;

-- ── date_wheel_pick (restore 0008) ──────────────────────────────────────────
drop policy if exists "date_wheel_pick_select_group_member" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick_insert_group_member" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick_update_group_member" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick_delete_group_member" on public.date_wheel_pick;

drop policy if exists "date_wheel_pick read" on public.date_wheel_pick;
create policy "date_wheel_pick read"
  on public.date_wheel_pick for select
  to authenticated using (true);

drop policy if exists "date_wheel_pick update" on public.date_wheel_pick;
create policy "date_wheel_pick update"
  on public.date_wheel_pick for update
  to authenticated using (true) with check (true);

-- ── wheel_quests (restore 0006 + 0007: read + update only) ───────────────────
drop policy if exists "wheel_quests_select_group_member" on public.wheel_quests;
drop policy if exists "wheel_quests_insert_group_member" on public.wheel_quests;
drop policy if exists "wheel_quests_update_group_member" on public.wheel_quests;
drop policy if exists "wheel_quests_delete_group_member" on public.wheel_quests;

drop policy if exists "wheel_quests read" on public.wheel_quests;
create policy "wheel_quests read"
  on public.wheel_quests for select
  to authenticated using (true);

drop policy if exists "wheel_quests update" on public.wheel_quests;
create policy "wheel_quests update"
  on public.wheel_quests for update
  to authenticated using (true);

-- ── daily_tasks (restore 0004 select + 0006 own CRUD) ───────────────────────
drop policy if exists "daily_tasks_select_group_member" on public.daily_tasks;
drop policy if exists "daily_tasks_insert_group_member" on public.daily_tasks;
drop policy if exists "daily_tasks_update_group_member" on public.daily_tasks;
drop policy if exists "daily_tasks_delete_group_member" on public.daily_tasks;

drop policy if exists "daily_tasks read by authed" on public.daily_tasks;
create policy "daily_tasks read by authed"
  on public.daily_tasks for select
  to authenticated using (true);

drop policy if exists "daily_tasks insert own" on public.daily_tasks;
create policy "daily_tasks insert own"
  on public.daily_tasks for insert
  to authenticated with check (auth.uid() = user_id);

drop policy if exists "daily_tasks update own" on public.daily_tasks;
create policy "daily_tasks update own"
  on public.daily_tasks for update
  to authenticated using (auth.uid() = user_id);

drop policy if exists "daily_tasks delete own" on public.daily_tasks;
create policy "daily_tasks delete own"
  on public.daily_tasks for delete
  to authenticated using (auth.uid() = user_id);

-- ── messages (restore 0001) ───────────────────────────────────────────────────
drop policy if exists "messages_select_group_member" on public.messages;
drop policy if exists "messages_insert_group_member" on public.messages;
drop policy if exists "messages_update_group_member" on public.messages;
drop policy if exists "messages_delete_group_member" on public.messages;

drop policy if exists "messages readable by authed" on public.messages;
create policy "messages readable by authed"
  on public.messages for select
  to authenticated using (true);

drop policy if exists "messages insert as self" on public.messages;
create policy "messages insert as self"
  on public.messages for insert
  to authenticated with check (auth.uid() = sender_id);

drop policy if exists "messages delete own" on public.messages;
create policy "messages delete own"
  on public.messages for delete
  to authenticated using (auth.uid() = sender_id);
