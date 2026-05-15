# Supabase SQL tests

## Cutover helper tests (`group_cutover.sql`)

Exercises the remaining cutover helper behavior after the latest migrations are applied on a branch or local database.

### Run

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/tests/group_cutover.sql
```

Success prints `PASS: all cutover helper tests succeeded`.

### What it checks

- `backfill_legacy_group(...)` creates the target group, memberships, active-group assignments, and backfills every legacy `group_id IS NULL` shared row.
- The backfill helper is guarded against a second run.
- `join_group_by_code(...)` switches the caller's active group to the joined group.
- `leave_group(...)` cleans unread rows, switches to a remaining group, and blocks the last owner from orphaning a group.
- The test resets the affected public tables inside a transaction so it can run against an already cut-over branch DB.
- `chat_last_read.group_id` is handled according to the live column nullability on the target database.

## RLS group tests (`rls_groups.sql`)

Exercises Phase 3 policies after migrations **0013–0020** are applied on a **branch or local** database (never prod first).

### Prerequisites

1. Supabase branch or `supabase start` local stack.
2. Migrations through `0020_cutover_helpers_up.sql` applied (`0013`–`0015` from Phase 1, `0016`, `0017`, `0018`, `0019`, `0020`).
3. `pgcrypto` enabled (for test user passwords).

### Run

```bash
# Local (default port 54322)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/tests/rls_groups.sql

# Branch: use the branch connection string from the dashboard
psql "$BRANCH_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_groups.sql
```

Success prints `PASS: all RLS group tests succeeded`. The script runs in a transaction and rolls back all seed data.

### What it checks

- User **B** (G1 only) cannot `SELECT` messages in **G2**.
- User **C** cannot `UPDATE` **A**'s `daily_tasks` in **G1**.
- User **A** active-group filtering via `profiles.active_group_id` (app-style queries).
- **Pets** remain `owner_id`-scoped (not group-scoped): user **B** cannot `SELECT`, `UPDATE`, or `DELETE` user **A**'s pets (`0019` owner-only read).
