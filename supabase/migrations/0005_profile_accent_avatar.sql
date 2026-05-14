-- ============================================================================
-- KinzSuite — per-user accent color and avatar emoji.
--
-- Each user picks their own color + emoji once and that's how they appear
-- to everyone (team color on the Pets/Today partner toggles, and as the
-- avatar in the chat header).
--
-- Idempotent — safe to re-run. Won't clobber colors a user has already
-- changed from the default.
-- ============================================================================

alter table public.profiles
  add column if not exists accent_color text not null default 'sky',
  add column if not exists avatar_emoji text not null default '🙂';

-- Loose check so we don't end up with arbitrary garbage in this column.
alter table public.profiles
  drop constraint if exists profiles_accent_color_check;
alter table public.profiles
  add constraint profiles_accent_color_check
  check (accent_color in ('sky', 'blush', 'sun', 'grass', 'purple'));

-- One-shot backfill: if everybody is still at the default value, assign the
-- oldest user 'sky' (blue) and the next-oldest 'blush' (pink). If anyone has
-- already personalized their color, leave everyone alone so we don't stomp
-- their choice on a re-run.
do $$
begin
  if (select count(distinct accent_color) from public.profiles) <= 1 then
    update public.profiles set accent_color = 'sky'
     where id = (select id from public.profiles order by created_at asc limit 1);
    update public.profiles set accent_color = 'blush'
     where id in (
       select id from public.profiles
        order by created_at asc
        offset 1 limit 1
     );
  end if;
end $$;
