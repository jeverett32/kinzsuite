-- ============================================================================
-- KinzSuite — message reactions
-- One reaction per user per message; updating replaces existing emoji.
-- ============================================================================

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
create index if not exists message_reactions_message_idx
  on public.message_reactions(message_id);

alter table public.message_reactions enable row level security;

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

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end $$;
