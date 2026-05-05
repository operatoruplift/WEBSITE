-- ----------------------------------------------------------------
--  Photon iMessage agent opt-outs
--  Apply with:
--    psql "$DATABASE_URL" -f lib/photon-optouts-migration.sql
-- ----------------------------------------------------------------
--
-- Stores per-sender opt-out flags so the iMessage agent stops
-- replying to anyone who texted STOP / unsubscribe / cancel.
--
-- The webhook checks this table before any reply (keyword or LLM).
-- Senders can re-enable replies by texting START / resume.
--
-- `opted_out_at` is the most recent STOP timestamp; null means not
-- currently opted out (the row may still exist if the sender
-- previously opted out and then sent START).
-- ----------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists public.imessage_opt_outs (
    sender text primary key,
    opted_out_at timestamptz,
    last_reason text,
    updated_at timestamptz not null default now()
);

create index if not exists imessage_opt_outs_active_idx
    on public.imessage_opt_outs (opted_out_at desc)
    where opted_out_at is not null;

alter table public.imessage_opt_outs enable row level security;

-- Service role (used by /api/webhooks/photon and the admin routes)
-- bypasses RLS. Authenticated clients never need direct access.
