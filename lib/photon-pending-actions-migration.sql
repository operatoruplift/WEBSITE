-- ----------------------------------------------------------------
--  Photon iMessage agent: pending tool-call confirmations
--  Apply with:
--    psql "$DATABASE_URL" -f lib/photon-pending-actions-migration.sql
-- ----------------------------------------------------------------
--
-- iMessage doesn't have inline buttons, so tool calls (Gmail draft,
-- Calendar create, etc.) need a two-turn confirmation:
--
--   Turn 1 (inbound):   "draft a reply to mom about Sunday dinner"
--   Bot reply:          "Want me to send 'Sounds great...' to
--                        mom@example.com? Reply YES to send."
--   Turn 2 (inbound):   "yes"
--   Bot reply:          "Sent. Receipt #042."
--
-- Between turn 1 and turn 2 the draft has to live somewhere. This
-- table is that buffer: one row per sender (most recent wins, so
-- "draft a different email" overwrites the prior pending row), with
-- a 5-minute TTL so a stale "yes" two days later is a no-op.
--
-- params is jsonb so the schema doesn't need to know which tool's
-- params it's holding. The webhook validates shape at execution
-- time against the typed handler in lib/photon/intents.ts.
-- ----------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists public.imessage_pending_actions (
    sender         text primary key,
    -- 'gmail.draft' | 'gmail.send' | 'calendar.create' | etc.
    action_type    text not null,
    params         jsonb not null,
    -- The drafted message we already sent the user as a confirmation
    -- prompt. Stored so /dev/photon can show "what was waiting" if
    -- the YES never arrives.
    preview_text   text,
    -- now() + 5 min by default. Past-expiry rows are deleted on next
    -- read or by the daily cron.
    expires_at     timestamptz not null,
    created_at     timestamptz not null default now()
);

create index if not exists imessage_pending_actions_expires_at_idx
    on public.imessage_pending_actions (expires_at);

alter table public.imessage_pending_actions enable row level security;

-- Service role (used by /api/webhooks/photon) bypasses RLS; clients
-- never reach this table directly.
