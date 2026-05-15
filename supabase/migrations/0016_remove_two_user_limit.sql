-- 0016_remove_two_user_limit_up.sql
-- Remove the two-user hard cap: drop trigger and function installed by 0003

-- Idempotent drops
DROP TRIGGER IF EXISTS enforce_two_user_max ON auth.users;
DROP FUNCTION IF EXISTS public.enforce_two_user_max();
