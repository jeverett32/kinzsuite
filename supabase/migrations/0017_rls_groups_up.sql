-- ============================================================================
-- KinzSuite — Phase 3: Row-Level Security (group membership)
-- Requires: 0013–0015 (group tables, group_id columns, is_group_member helper)
-- Idempotent policy names: <table>_<action>_group_member
-- ============================================================================

-- ── redeem_invite stub (Phase 5) ────────────────────────────────────────────
create or replace function public.redeem_invite(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  -- TODO(Phase 5): validate code, insert group_members, set active_group_id
  raise exception 'redeem_invite not implemented';
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;

-- ── messages ──────────────────────────────────────────────────────────────────
drop policy if exists "messages readable by authed" on public.messages;
drop policy if exists "messages insert as self" on public.messages;
drop policy if exists "messages delete own" on public.messages;
drop policy if exists "messages_select_group_member" on public.messages;
drop policy if exists "messages_insert_group_member" on public.messages;
drop policy if exists "messages_update_group_member" on public.messages;
drop policy if exists "messages_delete_group_member" on public.messages;

create policy "messages_select_group_member"
  on public.messages for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "messages_insert_group_member"
  on public.messages for insert
  to authenticated
  with check (
    public.is_group_member(group_id)
    and auth.uid() = sender_id
  );

create policy "messages_update_group_member"
  on public.messages for update
  to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "messages_delete_group_member"
  on public.messages for delete
  to authenticated
  using (public.is_group_member(group_id));

-- ── daily_tasks ─────────────────────────────────────────────────────────────
drop policy if exists "daily_tasks read by authed" on public.daily_tasks;
drop policy if exists "daily_tasks insert own" on public.daily_tasks;
drop policy if exists "daily_tasks update own" on public.daily_tasks;
drop policy if exists "daily_tasks delete own" on public.daily_tasks;
drop policy if exists "tasks readable by authed" on public.daily_tasks;
drop policy if exists "tasks insert by authed" on public.daily_tasks;
drop policy if exists "tasks update by authed" on public.daily_tasks;
drop policy if exists "tasks delete by authed" on public.daily_tasks;
drop policy if exists "daily_tasks_select_group_member" on public.daily_tasks;
drop policy if exists "daily_tasks_insert_group_member" on public.daily_tasks;
drop policy if exists "daily_tasks_update_group_member" on public.daily_tasks;
drop policy if exists "daily_tasks_delete_group_member" on public.daily_tasks;

create policy "daily_tasks_select_group_member"
  on public.daily_tasks for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "daily_tasks_insert_group_member"
  on public.daily_tasks for insert
  to authenticated
  with check (public.is_group_member(group_id));

create policy "daily_tasks_update_group_member"
  on public.daily_tasks for update
  to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "daily_tasks_delete_group_member"
  on public.daily_tasks for delete
  to authenticated
  using (public.is_group_member(group_id));

-- ── wheel_quests ──────────────────────────────────────────────────────────────
drop policy if exists "wheel_quests read" on public.wheel_quests;
drop policy if exists "wheel_quests insert" on public.wheel_quests;
drop policy if exists "wheel_quests update" on public.wheel_quests;
drop policy if exists "wheel_quests delete" on public.wheel_quests;
drop policy if exists "wheel_quests_select_group_member" on public.wheel_quests;
drop policy if exists "wheel_quests_insert_group_member" on public.wheel_quests;
drop policy if exists "wheel_quests_update_group_member" on public.wheel_quests;
drop policy if exists "wheel_quests_delete_group_member" on public.wheel_quests;

create policy "wheel_quests_select_group_member"
  on public.wheel_quests for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "wheel_quests_insert_group_member"
  on public.wheel_quests for insert
  to authenticated
  with check (public.is_group_member(group_id));

create policy "wheel_quests_update_group_member"
  on public.wheel_quests for update
  to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "wheel_quests_delete_group_member"
  on public.wheel_quests for delete
  to authenticated
  using (public.is_group_member(group_id));

-- ── date_wheel_pick ─────────────────────────────────────────────────────────
drop policy if exists "date_wheel_pick read" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick update" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick_select_group_member" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick_insert_group_member" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick_update_group_member" on public.date_wheel_pick;
drop policy if exists "date_wheel_pick_delete_group_member" on public.date_wheel_pick;

create policy "date_wheel_pick_select_group_member"
  on public.date_wheel_pick for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "date_wheel_pick_insert_group_member"
  on public.date_wheel_pick for insert
  to authenticated
  with check (public.is_group_member(group_id));

create policy "date_wheel_pick_update_group_member"
  on public.date_wheel_pick for update
  to authenticated
  using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

create policy "date_wheel_pick_delete_group_member"
  on public.date_wheel_pick for delete
  to authenticated
  using (public.is_group_member(group_id));

-- ── chat_last_read ──────────────────────────────────────────────────────────
alter table public.chat_last_read enable row level security;

drop policy if exists "chat_last_read_select_group_member" on public.chat_last_read;
drop policy if exists "chat_last_read_insert_group_member" on public.chat_last_read;
drop policy if exists "chat_last_read_update_group_member" on public.chat_last_read;
drop policy if exists "chat_last_read_delete_group_member" on public.chat_last_read;

create policy "chat_last_read_select_group_member"
  on public.chat_last_read for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "chat_last_read_insert_group_member"
  on public.chat_last_read for insert
  to authenticated
  with check (
    public.is_group_member(group_id)
    and auth.uid() = user_id
  );

create policy "chat_last_read_update_group_member"
  on public.chat_last_read for update
  to authenticated
  using (
    public.is_group_member(group_id)
    and auth.uid() = user_id
  )
  with check (
    public.is_group_member(group_id)
    and auth.uid() = user_id
  );

create policy "chat_last_read_delete_group_member"
  on public.chat_last_read for delete
  to authenticated
  using (
    public.is_group_member(group_id)
    and auth.uid() = user_id
  );

-- ── message_reactions (via messages.group_id) ─────────────────────────────────
drop policy if exists "reactions readable by authed" on public.message_reactions;
drop policy if exists "reactions insert as self" on public.message_reactions;
drop policy if exists "reactions update own" on public.message_reactions;
drop policy if exists "reactions delete own" on public.message_reactions;
drop policy if exists "message_reactions_select_group_member" on public.message_reactions;
drop policy if exists "message_reactions_insert_group_member" on public.message_reactions;
drop policy if exists "message_reactions_update_group_member" on public.message_reactions;
drop policy if exists "message_reactions_delete_group_member" on public.message_reactions;

create policy "message_reactions_select_group_member"
  on public.message_reactions for select
  to authenticated
  using (
    exists (
      select 1
        from public.messages m
       where m.id = message_reactions.message_id
         and public.is_group_member(m.group_id)
    )
  );

create policy "message_reactions_insert_group_member"
  on public.message_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
        from public.messages m
       where m.id = message_reactions.message_id
         and public.is_group_member(m.group_id)
    )
  );

create policy "message_reactions_update_group_member"
  on public.message_reactions for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
        from public.messages m
       where m.id = message_reactions.message_id
         and public.is_group_member(m.group_id)
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
        from public.messages m
       where m.id = message_reactions.message_id
         and public.is_group_member(m.group_id)
    )
  );

create policy "message_reactions_delete_group_member"
  on public.message_reactions for delete
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
        from public.messages m
       where m.id = message_reactions.message_id
         and public.is_group_member(m.group_id)
    )
  );

-- ── groups ────────────────────────────────────────────────────────────────────
alter table public.groups enable row level security;

drop policy if exists "groups_select_group_member" on public.groups;
drop policy if exists "groups_insert_group_member" on public.groups;
drop policy if exists "groups_update_group_member" on public.groups;
drop policy if exists "groups_delete_group_member" on public.groups;

create policy "groups_select_group_member"
  on public.groups for select
  to authenticated
  using (public.is_group_member(id));

create policy "groups_insert_group_member"
  on public.groups for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "groups_update_group_member"
  on public.groups for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ── group_members ─────────────────────────────────────────────────────────────
alter table public.group_members enable row level security;

drop policy if exists "group_members_select_group_member" on public.group_members;
drop policy if exists "group_members_insert_group_member" on public.group_members;
drop policy if exists "group_members_update_group_member" on public.group_members;
drop policy if exists "group_members_delete_group_member" on public.group_members;
drop policy if exists "group_members_delete_owner" on public.group_members;
drop policy if exists "group_members_delete_self" on public.group_members;

create policy "group_members_select_group_member"
  on public.group_members for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_members_delete_owner"
  on public.group_members for delete
  to authenticated
  using (
    exists (
      select 1
        from public.group_members gm
       where gm.group_id = group_members.group_id
         and gm.user_id = auth.uid()
         and gm.role = 'owner'
    )
  );

create policy "group_members_delete_self"
  on public.group_members for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── group_invites ─────────────────────────────────────────────────────────────
alter table public.group_invites enable row level security;

drop policy if exists "group_invites_select_group_member" on public.group_invites;
drop policy if exists "group_invites_insert_group_member" on public.group_invites;
drop policy if exists "group_invites_update_group_member" on public.group_invites;
drop policy if exists "group_invites_delete_group_member" on public.group_invites;

create policy "group_invites_select_group_member"
  on public.group_invites for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "group_invites_insert_group_member"
  on public.group_invites for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and exists (
      select 1
        from public.group_members gm
       where gm.group_id = group_invites.group_id
         and gm.user_id = auth.uid()
         and gm.role = 'owner'
    )
  );

create policy "group_invites_update_group_member"
  on public.group_invites for update
  to authenticated
  using (
    exists (
      select 1
        from public.group_members gm
       where gm.group_id = group_invites.group_id
         and gm.user_id = auth.uid()
         and gm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
        from public.group_members gm
       where gm.group_id = group_invites.group_id
         and gm.user_id = auth.uid()
         and gm.role = 'owner'
    )
  );

-- pets + profiles: unchanged (profiles self update already covers active_group_id)
