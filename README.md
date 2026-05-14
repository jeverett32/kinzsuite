# KinzSuite

A cozy, sticker-styled pet companion app for two people. Built with Next.js,
Supabase, and Tailwind CSS.

Features:

- **Today** — shared daily-quest checklist that syncs live between both partners
- **Pets** — polaroid-style gallery; upload photos, pick from 8 cute species
- **Date** — spin the wheel to pick tonight's adventure
- **Chat** — realtime messaging with image attachments
- Magic-link sign-in via Supabase Auth

---

## 1. Local setup

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see step 2)
npm run dev
```

App runs at <http://localhost:3000>.

---

## 2. Supabase setup

### 2a. Create a project

1. Go to <https://supabase.com> and create a new project (the free tier is fine).
2. When it finishes provisioning, open **Settings → API Keys** (Supabase's new
   key format, see <https://supabase.com/docs/guides/getting-started/api-keys>)
   and copy:
   - **Project URL** (under Settings → General → Project URL or the API page)
     → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (starts with `sb_publishable_…`) →
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Paste them into `.env.local`.

> **About the new keys.** Supabase deprecated the legacy `anon` / `service_role`
> JWT keys in 2025. Projects now use `sb_publishable_…` (browser-safe, gated by
> RLS) and `sb_secret_…` (backend-only). This app only needs the publishable
> key — RLS in `0001_init.sql` handles authorization. Legacy `anon` keys still
> work in the same env var during the migration window if your project pre-dates
> the change.

### 2b. Run the SQL migrations

In the Supabase dashboard go to **SQL Editor → New query**, then for each file
below: paste, click **Run**, in this order:

1. `supabase/migrations/0001_init.sql` — tables, RLS, realtime, seed data
2. `supabase/migrations/0002_storage.sql` — pets + chat-images buckets and policies

Both scripts are idempotent — safe to re-run.

### 2c. Configure Auth

1. **Authentication → Providers → Email** is on by default — keep it on. Magic
   links work out of the box.
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for dev, `https://YOUR-APP.vercel.app` in prod
   - **Redirect URLs**: add both
     - `http://localhost:3000/auth/callback`
     - `https://YOUR-APP.vercel.app/auth/callback`
3. (Optional but recommended) **Authentication → Email Templates → Magic Link**:
   change the subject/body to something cuter — anything you write will be sent
   to you and your girlfriend.

### 2d. Invite your partner

There's no public sign-up flow inside the app — both of you just request a
magic link from `/login`. The first time either of you enters your email,
Supabase creates an auth user and the database trigger creates a matching
`profiles` row. You can rename yourselves later by updating
`profiles.display_name` (next step).

### 2e. Set display names

Run this in the SQL editor (replace the emails):

```sql
update public.profiles
   set display_name = 'Jess'
 where id = (select id from auth.users where email = 'you@example.com');

update public.profiles
   set display_name = 'Sam'
 where id = (select id from auth.users where email = 'her@example.com');
```

### 2f. (Optional) Nightly task reset

The included `reset_stale_daily_tasks()` function clears yesterday's
completions. The app also resets them client-side on load, so this is just a
belt-and-suspenders cron. To enable it, in the SQL editor:

```sql
-- enables the pg_cron extension
create extension if not exists pg_cron;
-- runs every day at 04:00 UTC
select cron.schedule(
  'reset-daily-tasks',
  '0 4 * * *',
  $$ select public.reset_stale_daily_tasks() $$
);
```

---

## 3. Vercel deployment

1. Push this repo to GitHub.
2. Go to <https://vercel.com/new> and import the repo. Defaults are correct
   (framework: Next.js).
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` → `https://YOUR-APP.vercel.app` (use the URL Vercel
     gives you on the first deploy; you can edit it after the first build)
4. Click **Deploy**.
5. Once it deploys, go back to your Supabase project → **Authentication → URL
   Configuration** and update **Site URL** + **Redirect URLs** to your real
   Vercel domain.

That's it — open the deployed URL, request a magic link, and the app is live.

---

## 4. Project layout

```
src/
  app/
    (app)/             # authenticated app (header + bottom nav)
      page.tsx         # Today view (default)
      pets/page.tsx
      date/page.tsx
      chat/page.tsx
      layout.tsx       # auth check + shell
    auth/
      callback/route.ts
      sign-out/route.ts
    login/page.tsx
    layout.tsx         # fonts + global styles
    globals.css
  components/
    shell/             # Header, BottomNav
    ui/                # ChunkyButton, Chip, PetPortrait, PolaroidCard, ...
    views/             # TodayView, PetsView, DateView, ChatView
  lib/
    supabase/          # client, server, middleware, types
    utils.ts           # palette helpers, pet types
    quests.ts          # date-wheel quest list
supabase/
  migrations/          # paste-into-SQL-Editor migrations
```

---

## 5. Scripts

```bash
npm run dev        # next dev
npm run build      # next build
npm run start      # next start (after build)
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

---

## 6. Tweaks you might want

- **Edit the quest list**: `src/lib/quests.ts`
- **Change the daily tasks**: re-run an `update`/`insert` on the
  `public.daily_tasks` table, or edit them in the Supabase Table Editor
- **Re-skin colors**: change `PALETTE` in `src/lib/utils.ts` and `colors` in
  `tailwind.config.ts`
- **Different display names**: update `profiles.display_name` (see step 2e)
