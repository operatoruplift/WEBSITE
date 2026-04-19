-- Photon iMessage transport tables
--
-- Run manually in the Supabase SQL editor. This file is the source of
-- truth for the schema the webhook + send routes expect; it is NOT
-- auto-applied. See docs/photon-imessage.md for the runbook.
--
-- Both tables are server-write-only (service role key); the app never
-- surfaces user-facing reads against them. RLS remains enabled for
-- defence in depth even though no direct client access is intended.

create table if not exists inbound_messages (
    id uuid primary key default gen_random_uuid(),
    provider text not null default 'photon',
    platform text not null default 'imessage',
    event_type text not null default 'message',
    sender text,
    /** E.164 number or handle that our bot received this message on. */
    recipient text,
    /** Stable per-conversation id from Photon. Used to reply into the same thread. */
    thread_id text,
    /** Stable per-message id. Used for idempotent webhook retry handling. */
    message_id text,
    text text,
    raw jsonb,
    received_at timestamptz not null default now(),
    /** Server-generated req_<uuid> echoed back as X-Request-Id. */
    request_id text,
    /** 'new' | 'replayed' | 'duplicate' */
    status text not null default 'new'
);

-- Idempotency: two rows must never share (provider, message_id) once
-- message_id is populated.
create unique index if not exists inbound_messages_msg_unique
    on inbound_messages (provider, message_id)
    where message_id is not null;

create index if not exists inbound_messages_thread_idx
    on inbound_messages (thread_id);

create index if not exists inbound_messages_received_at_idx
    on inbound_messages (received_at desc);

alter table inbound_messages enable row level security;
-- No policies = no client-role access (service role bypasses RLS).

create table if not exists outbound_messages (
    id uuid primary key default gen_random_uuid(),
    provider text not null default 'photon',
    platform text not null default 'imessage',
    /** E.164 or handle the message was sent to. */
    recipient text,
    /** Same thread_id as the inbound that this replies to, when known. */
    thread_id text,
    text text,
    /** The id Photon returned (message_id | id | uuid | messageId). */
    photon_message_id text,
    /** 'pending' | 'sent' | 'failed' | 'not_configured'. */
    status text not null default 'pending',
    failure_reason text,
    sent_at timestamptz not null default now(),
    request_id text,
    /** Whether this send was a "pong" from the dev harness rather than an agent reply. */
    source text default 'agent'
);

create index if not exists outbound_messages_thread_idx
    on outbound_messages (thread_id);

create index if not exists outbound_messages_sent_at_idx
    on outbound_messages (sent_at desc);

alter table outbound_messages enable row level security;
