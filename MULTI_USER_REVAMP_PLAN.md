# Multi-User Group Revamp — Implementation Plan

Living checklist for converting the app from a hardcoded 2-user (partner) model into a multi-user, multi-group model. Mark items off as completed. Each phase ends with a verification gate that must pass before moving on.

**Owner:** John
**Started:** 2026-05-15
**Target users for first migration:** John, Cam (existing data preserved)

---

## Phase 0 — Backups & Rollback Safety Net

Goal: guarantee we can restore the current database byte-for-byte if anything goes wrong.

### 0.1 Snapshots
- [ ] Take Supabase dashboard manual backup (Database → Backups → "Create backup")
- [ ] Record backup ID + timestamp in this file: `BACKUP_ID:` `TIMESTAMP:`
- [ ] Confirm point-in-time recovery (PITR) window covers planned migration date

### 0.2 Local logical dumps
- [ ] `supabase db dump --schema-only -f backups/2026xxxx_schema.sql`
- [ ] `supabase db dump --data-only   -f backups/2026xxxx_data.sql`
- [ ] `supabase db dump --role-only   -f backups/2026xxxx_roles.sql`
- [ ] Verify dumps restore cleanly into a fresh local Postgres
- [ ] Commit `backups/` dumps to a private branch (NOT main) or store off-repo

### 0.3 Branch DB for testing
- [ ] Create Supabase branch database (`create_branch`)
- [ ] Apply all new migrations to branch first, never prod directly
- [ ] Record branch ID: `BRANCH_ID:`

### 0.4 Down-migration pairing rule
- [ ] Adopt convention: every new `NNNN_*_up.sql` ships with `NNNN_*_down.sql`
- [ ] Down scripts tested on branch before up runs on prod
- [ ] Add CI check or local script `npm run migrate:verify-pairs`

**Gate:** Restore drill performed at least once on the branch DB. Confirmed identical row counts and schema diff = 0 vs. prod snapshot.

---

## Phase 1 — Schema Design

Goal: introduce group primitives without breaking existing data.

### 1.1 New tables
- [ ] `groups` (id, name, invite_code, created_by, created_at)
- [ ] `group_members` (group_id, user_id, role, joined_at, sort_order)
- [ ] `group_invites` (code, group_id, created_by, expires_at, revoked_at, uses_remaining)
  - Decision: separate invites table vs. single `invite_code` on `groups`. **Default: separate table** so codes can rotate/expire without losing group identity.
- [ ] Indexes: `(user_id, group_id)`, `(group_id, user_id)`, `(invite_code)` unique

### 1.2 Add `group_id` to shared tables
- [ ] `messages.group_id`
- [ ] `daily_tasks.group_id`
- [ ] `date_wheel_pick.group_id`
- [ ] `wheel_quests.group_id` (or future `activity_wheel.group_id`)
- [ ] `message_reactions` inherits via `messages`
- [ ] `chat_last_read.group_id`
- [ ] Any future shared settings table

### 1.3 Personal tables stay user-scoped
- [ ] `pets` → keep `user_id` only, NO `group_id`
- [ ] `profiles` → add `active_group_id` (FK to `groups`, nullable)
- [ ] `push_subscriptions` → user-scoped, unchanged

### 1.4 Helper functions (SECURITY DEFINER)
- [ ] `is_group_member(gid uuid) returns boolean`
- [ ] `current_active_group() returns uuid` (reads `profiles.active_group_id`)
- [ ] `get_group_members(gid uuid)` ordered (caller first, then by `sort_order`)
- [ ] `generate_invite_code()` — 8–10 char nanoid-style, collision-checked

### 1.5 Migration files
- [ ] `0013_groups_up.sql` / `0013_groups_down.sql`
- [ ] `0014_group_id_columns_up.sql` / `_down.sql`
- [ ] `0015_helpers_up.sql` / `_down.sql`

**Gate:** Branch DB has new schema, old data still queryable, all existing tests pass.

---

## Phase 2 — Remove 2-User Assumptions

Goal: strip the hardcoded "partner" model.

### 2.1 Triggers & constraints
- [ ] Drop `0003_two_user_limit.sql` trigger and any helpers it installed
- [ ] Search codebase for hardcoded partner UUIDs / `auth.users` count checks
- [ ] Remove "partner" terminology from DB comments and policy names

### 2.2 Migration
- [ ] `0016_remove_two_user_limit_up.sql` / `_down.sql`
- [ ] Down script reinstalls the trigger exactly

**Gate:** Inserting a 3rd `auth.users` row on branch DB succeeds.

---

## Phase 3 — Row-Level Security Rewrite

Goal: all access flows through `is_group_member`.

### 3.1 Policy rewrite
- [ ] `messages`: select/insert/update/delete gated by `is_group_member(group_id)`
- [ ] `daily_tasks`: same
- [ ] `date_wheel_pick`: same
- [ ] `wheel_quests`: same
- [ ] `chat_last_read`: same
- [ ] `message_reactions`: same (via message's group)
- [ ] `groups`: members can SELECT; only `created_by` (owner) can UPDATE name; INSERT open to any authed user
- [ ] `group_members`: members can SELECT own group; owner can DELETE; users can DELETE self (leave)
- [ ] `group_invites`: members can SELECT; owner can INSERT/REVOKE

### 3.2 Personal-data policies untouched
- [ ] `pets` policies remain user_id-based
- [ ] `profiles` unchanged except new column

### 3.3 RLS test suite
- [ ] Seed script: 3 users, 2 groups, overlap user
- [ ] Tests: cross-group read blocked, cross-group write blocked, non-member sees nothing
- [ ] pgTAP or plain SQL assertions checked into `supabase/tests/`

### 3.4 Migration files
- [ ] `0017_rls_groups_up.sql` / `_down.sql`

**Gate:** RLS test suite green on branch DB. Manual smoke test confirms John in group A cannot see group B messages.

---

## Phase 4 — Data Migration for Existing Users (John + Cam)

Goal: zero data loss, transparent transition.

### 4.1 Backfill script
- [ ] Create group "John & Cam" (or chosen name) owned by John
- [ ] Insert both users into `group_members` (John first, Cam second by `sort_order`)
- [ ] Set both users' `profiles.active_group_id` to the new group
- [ ] Backfill `group_id` on every shared row: `messages`, `daily_tasks`, `date_wheel_pick`, `wheel_quests`, `chat_last_read`, `message_reactions`
- [ ] Verify row counts before/after match exactly per table

### 4.2 Order of operations on prod
1. [ ] Snapshot
2. [ ] Apply migrations 0013–0016 (schema only, no RLS swap yet)
3. [ ] Run backfill script in a transaction
4. [ ] Verify counts + sample reads
5. [ ] Apply migration 0017 (RLS swap)
6. [ ] Smoke test with both accounts

### 4.3 Rollback rehearsal
- [ ] Run full sequence on branch DB
- [ ] Run paired `_down.sql` migrations in reverse
- [ ] Confirm schema diff = 0 vs. pre-migration snapshot

**Gate:** Branch DB restored cleanly. Backfill verified idempotent or guarded against re-run.

---

## Phase 5 — Auth & Onboarding

Goal: split login UX, support invite-code joining.

### 5.1 Sign-in screen
- [ ] Split current combined screen into "Sign in" and "Create account"
- [ ] Sign-in: email + password only
- [ ] Create account: email, password, display name, optional invite code

### 5.2 Invite-code flow
- [ ] If code entered: validate, redeem, join group, set as `active_group_id`
- [ ] If no code: create new group, generate code, set as `active_group_id`
- [ ] Show generated code on a "Your group is ready" confirmation screen with copy button

### 5.3 Code redemption safety
- [ ] Rate-limit by IP and user (e.g., 5 attempts / 10 min)
- [ ] Codes default expire 7 days
- [ ] Owner can revoke / regenerate from Settings

**Gate:** New user signup creates new group OR joins existing via code. Both flows verified end-to-end on branch.

---

## Phase 6 — Group Switcher & Active Group Plumbing

Goal: one user can belong to N groups, viewing one at a time.

### 6.1 Active group source of truth
- [ ] `profiles.active_group_id` is canonical
- [ ] App-wide hook `useActiveGroup()` reads from profile (with realtime subscription)
- [ ] On switch: update profile, refetch all shared data, re-subscribe realtime channels

### 6.2 Group switcher UI
- [ ] Entry point in app header or Settings
- [ ] Lists all groups user belongs to, highlights active
- [ ] "Create new group" action
- [ ] "Join group" action (invite code entry)
- [ ] "Leave group" action (with confirmation)

### 6.3 Realtime channel scoping
- [ ] Audit every `supabase.channel(...)` subscription
- [ ] Filter by `group_id` on every shared-data channel
- [ ] On group switch: unsubscribe old channels, subscribe new

**Gate:** User in 2 groups can switch and see distinct, isolated data. Realtime updates do not leak across groups.

---

## Phase 7 — Shared View Rewrites

Goal: replace partner toggle with member pill strip.

### 7.1 Shared component
- [ ] Build `<MemberPillStrip selectedUserId onChange members />`
- [ ] Horizontal scrollable
- [ ] Self pill always first
- [ ] Other members ordered by `sort_order` then join date

### 7.2 TodayView
- [ ] Replace 2-toggle with `<MemberPillStrip />`
- [ ] Query `daily_tasks` filtered by `group_id = active` AND `user_id = selected_pill`
- [ ] Layout/behavior otherwise unchanged

### 7.3 PetsView
- [ ] Same pill-strip swap
- [ ] Query `pets` by `user_id = selected_pill` (pets stay user-owned)
- [ ] Self pill first

### 7.4 ChatView
- [ ] One chat per group
- [ ] Query `messages` by `group_id = active`
- [ ] Member name + avatar on each bubble (no more partner-vs-self assumption)
- [ ] `chat_last_read` keyed by `(user_id, group_id)`

### 7.5 DateView (activity wheel)
- [ ] Editable wheel scoped to active group
- [ ] Decision: per-member or shared list? **Default: shared per group**, edit-any-member
- [ ] `date_wheel_pick.group_id = active`

### 7.6 Settings / Profile
- [ ] Show active group name + members list
- [ ] Show invite code with copy + regenerate (owner only)
- [ ] Switch group / create group / join group / leave group actions
- [ ] Account-level prefs (display name, avatar, accent) stay user-scoped

### 7.7 Layout / header / nav
- [ ] Remove "partner" copy
- [ ] Show active group name in header

**Gate:** All five primary views work with pill strip on a 3-member group. No "partner" string remains in `src/`.

---

## Phase 8 — Types & Helpers Cleanup

- [ ] Regenerate Supabase TS types (`supabase gen types`)
- [ ] Replace `partner` references in:
  - [ ] layout / header / nav
  - [ ] TodayView
  - [ ] PetsView
  - [ ] ChatView
  - [ ] DateView
  - [ ] AdministrationView
  - [ ] ProfileSheet
- [ ] Centralize group helpers in `src/lib/groups.ts`:
  - [ ] `getActiveGroup()`
  - [ ] `getMembers(groupId)`
  - [ ] `switchActiveGroup(groupId)`
  - [ ] `joinByCode(code)`
  - [ ] `leaveGroup(groupId)`
  - [ ] `regenerateCode(groupId)`

**Gate:** `tsc --noEmit` clean. No dead "partner" symbols in grep.

---

## Phase 9 — Edge Cases & Permissions

- [ ] Leaving a group: data stays with group (do NOT delete that user's messages/tasks)
- [ ] Last member leaves: group soft-deleted or archived (decision pending)
- [ ] Group rename: owner only
- [ ] Group delete: owner only, with confirmation
- [ ] Permission tiers: `owner` vs `member` enum on `group_members.role`
- [ ] Account deletion: cascade through `group_members`, transfer ownership if owner, else archive empty groups

**Gate:** Each edge case has a manual test script run on branch DB.

---

## Phase 10 — End-to-End Validation

- [ ] Signup → new group → verify only self visible
- [ ] Signup → join via code → verify both members see each other
- [ ] Third user joins → all three see each other in pill strips
- [ ] User in 2 groups → switch → distinct data, no leak
- [ ] Realtime: message in group A does not push to group B
- [ ] Push notifications still target correct user
- [ ] Pets remain personal across group switches
- [ ] Migration run on prod with John+Cam → both accounts see identical content to pre-migration

**Gate:** All ten validations checked, signed off, dated.

---

## Phase 11 — Production Cutover

- [ ] Announce maintenance window
- [ ] Take fresh snapshot
- [ ] Run paired up-migrations 0013 → 0017
- [ ] Run backfill
- [ ] Smoke test with both accounts
- [ ] Monitor logs for 24h
- [ ] If green: delete branch DB, archive backups

**Rollback trigger:** any data-loss symptom, any user lockout, any RLS leak.
**Rollback procedure:**
1. Pause writes
2. Run down-migrations 0017 → 0013 in reverse
3. If still broken: PITR or restore from logical dump
4. Post-mortem before retrying

---

## Open Decisions

- [ ] Group rename allowed by all members or owner only? (default: owner)
- [ ] Wheel quests / date wheel: per-member or per-group? (default: per-group)
- [ ] Last-member-leaves: archive or hard-delete? (default: archive)
- [ ] Invite code expiry default: 7 days? Configurable?
- [ ] Cap on groups per user? (default: no cap)
- [ ] Cap on members per group? (default: no cap, monitor perf)

---

## Reference

- Backups dir: `backups/`
- Migration dir: `supabase/migrations/`
- RLS tests: `supabase/tests/`
- Helper module: `src/lib/groups.ts`
