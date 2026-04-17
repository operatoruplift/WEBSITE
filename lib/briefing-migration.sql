-- ----------------------------------------------------------------
--  Daily briefing migration — notifications + users.briefing_enabled
--  Apply with:
--    psql "$DATABASE_URL" -f lib/briefing-migration.sql
-- ----------------------------------------------------------------
--
-- Supabase-backed notifications (as distinct from the localStorage
-- ones in lib/notifications.ts — those are client-side UX fluff).
-- This table drives the pinned-briefing row rendered at the top of
-- /chat when the user loads the page.
--
-- `type` values in use:
--   daily_briefing        — written by /api/cron/daily-briefing
--   reminder:weather      — written by /api/tools/reminders
--   reminder:calendar_summary
--   reminder:horoscope
--   reminder:custom
--
-- `pinned_until` = when the row should stop being surfaced in /chat.
-- Daily briefings expire at 23:59 local time; reminders fire at the
-- scheduled time (the cron/consumer treats pinned_until as the
-- trigger moment).
-- ----------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    type text not null,
    title text,
    body text,
    pinned_until timestamptz,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_pinned_idx
    on public.notifications (user_id, pinned_until desc);

create index if not exists notifications_user_id_type_idx
    on public.notifications (user_id, type);

alter table public.notifications enable row level security;

do $$ begin
    if not exists (
        select 1 from pg_policies where policyname = 'notifications_owner_select' and tablename = 'notifications'
    ) then
        create policy notifications_owner_select on public.notifications
            for select using (user_id = auth.jwt() ->> 'sub');
        create policy notifications_owner_mutate on public.notifications
            for all using (user_id = auth.jwt() ->> 'sub')
            with check (user_id = auth.jwt() ->> 'sub');
    end if;
end $$;

-- ----------------------------------------------------------------
-- users.briefing_enabled — opt-in toggle. Default OFF so users have
-- to explicitly ask for the daily briefing.
-- ----------------------------------------------------------------

create table if not exists public.users (
    user_id text primary key,
    created_at timestamptz not null default now()
);

alter table public.users
    add column if not exists briefing_enabled boolean not null default false;

alter table public.users
    add column if not exists updated_at timestamptz not null default now();

alter table public.users enable row level security;

do $$ begin
    if not exists (
        select 1 from pg_policies where policyname = 'users_owner_all' and tablename = 'users'
    ) then
        create policy users_owner_all on public.users
            for all using (user_id = auth.jwt() ->> 'sub')
            with check (user_id = auth.jwt() ->> 'sub');
    end if;
end $$;
