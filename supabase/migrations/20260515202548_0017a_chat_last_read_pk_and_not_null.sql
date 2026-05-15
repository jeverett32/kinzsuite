-- Composite PK and NOT NULL group_id on chat_last_read (idempotent).
-- Originally applied on remote as 20260515202548; kept for history alignment.

delete from public.chat_last_read where group_id is null;

alter table public.chat_last_read
  alter column group_id set not null;

alter table public.chat_last_read
  drop constraint if exists chat_last_read_pkey;

alter table public.chat_last_read
  add constraint chat_last_read_pkey primary key (user_id, group_id);
