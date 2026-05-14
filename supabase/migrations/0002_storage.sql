-- ============================================================================
-- KinzSuite — storage buckets and policies
-- Run this AFTER 0001_init.sql.
-- ============================================================================

-- Create the buckets (public so we can use public URLs in <img>).
insert into storage.buckets (id, name, public)
values ('pets', 'pets', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do update set public = excluded.public;

-- ── Pet photos: any authed user can read, only owners can write into their
-- own folder. Convention: object name starts with `<auth.uid()>/...`.
drop policy if exists "pets bucket read" on storage.objects;
create policy "pets bucket read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'pets');

drop policy if exists "pets bucket write own" on storage.objects;
create policy "pets bucket write own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "pets bucket update own" on storage.objects;
create policy "pets bucket update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'pets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "pets bucket delete own" on storage.objects;
create policy "pets bucket delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Chat images: same pattern. Objects live under `<auth.uid()>/<uuid>.jpg`.
drop policy if exists "chat bucket read" on storage.objects;
create policy "chat bucket read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-images');

drop policy if exists "chat bucket write own" on storage.objects;
create policy "chat bucket write own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "chat bucket delete own" on storage.objects;
create policy "chat bucket delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
