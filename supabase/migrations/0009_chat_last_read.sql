-- Per-user timestamp for "last time I viewed chat"; used for unread indicator.
alter table public.profiles
  add column if not exists chat_last_read_at timestamptz;
