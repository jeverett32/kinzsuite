# Supabase SQL tests

## RLS group tests (`rls_groups.sql`)

Exercises Phase 3 policies after migrations **0013–0019** are applied on a **branch or local** database (never prod first).

### Prerequisites

1. Supabase branch or `supabase start` local stack.
2. Migrations through `0019_pets_owner_select_up.sql` applied (`0013`–`0015` from Phase 1, `0016`, `0017`, `0018`, `0019`).
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
