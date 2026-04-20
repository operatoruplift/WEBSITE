-- ----------------------------------------------------------------
--  Photon Spectrum inbound messages
--  Apply with:
--    psql "$DATABASE_URL" -f lib/photon-webhook-migration.sql
-- ----------------------------------------------------------------
--
-- Stores every webhook POST from Photon Spectrum so the agent loop
-- has a durable queue to process inbound iMessage / Telegram /
-- WhatsApp traffic.
--
-- `raw` keeps the full payload in jsonb so we can add new fields
-- (attachments, reactions, typing indicators) without schema churn.
-- `processed_at` is set once an agent responds — easy "pending"
-- queue via `where processed_at is null`.
-- ----------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists public.inbound_messages (
    id uuid primary key default gen_random_uuid(),
    provider text not null default 'photon',
    platform text not null,
    event_type text not null default 'message',
    sender text not null,
    text text,
    raw jsonb,
    received_at timestamptz not null default now(),
    processed_at timestamptz,
    reply_message_id text,
    -- W1A-imessage-1: idempotency + 5s ack fallback bookkeeping.
    -- provider_message_id is the id we read from the webhook payload
    -- (body.message_id | body.id | body.event_id | content hash
    -- fallback). Unique per (provider, provider_message_id) so a
    -- retried webhook POST is a no-op on insert.
    provider_message_id text,
    acked_at timestamptz
);

-- Idempotent insert guard. Retries from Spectrum hit the same row.
create unique index if not exists inbound_messages_provider_msgid_idx
    on public.inbound_messages (provider, provider_message_id)
    where provider_message_id is not null;

create index if not exists inbound_messages_provider_unprocessed_idx
    on public.inbound_messages (provider, received_at desc)
    where processed_at is null;

create index if not exists inbound_messages_sender_received_idx
    on public.inbound_messages (sender, received_at desc);

alter table public.inbound_messages enable row level security;

-- Service role (used by /api/webhooks/photon and the agent loop)
-- bypasses RLS. Authenticated clients never need direct access —
-- the agent chat surfaces inbound messages.
