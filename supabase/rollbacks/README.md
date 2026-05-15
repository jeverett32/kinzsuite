# Rollback scripts

Down migrations live here so `supabase/migrations` only contains forward SQL.
Each `*_down.sql` pairs with a matching file in `../migrations/` (without `_up` in the name).

Run manually when rolling back; they are not applied by `supabase db push`.
