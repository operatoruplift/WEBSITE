-- ----------------------------------------------------------------
--  Photon iMessage agent: per-user prefs + verification
--  Apply with:
--    psql "$DATABASE_URL" -f lib/photon-imessage-users-migration.sql
-- ----------------------------------------------------------------
--
-- Two tables that turn the iMessage agent from anonymous one-shot
-- replies into per-user behavior:
--
--   imessage_users           , verified phone -> Privy account map
--                              + per-user prefs (model, system prompt
--                              override, location, zodiac, summary).
--                              Webhook reads this on every inbound to
--                              tailor the agent's reply.
--
--   imessage_verifications   , short-lived 6-digit-code rows used by
--                              POST /api/integrations/imessage/start
--                              and /confirm. Codes are stored as a
--                              SHA-256 hash, never plaintext, with a
--                              10-minute expiry and a per-row attempt
--                              counter. Successful confirm deletes
--                              the row.
--
-- Both tables enable RLS but are written/read by the service-role
-- key from server routes only. End-user clients never touch them.
-- ----------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- imessage_users
-- ----------------------------------------------------------------
create table if not exists public.imessage_users (
    -- E.164 phone (or platform-id for non-iMessage senders).
    sender                 text primary key,
    -- Privy account this phone is linked to. Null until verification.
    privy_user_id          text,
    verified_at            timestamptz,
    -- Free-form metadata the agent reads at inference time.
    timezone               text,
    location               text,
    zodiac                 text,
    -- Per-user model override; null falls back to PHOTON_AGENT_MODEL.
    model_pref             text,
    -- Per-user system prompt override; null falls back to default.
    system_prompt_override text,
    -- Daily-cron rolled-up summary of older context (older than the
    -- 5-turn live history window).
    summary                text,
    created_at             timestamptz not null default now(),
    updated_at             timestamptz not null default now()
);

create index if not exists imessage_users_privy_user_id_idx
    on public.imessage_users (privy_user_id)
    where privy_user_id is not null;

-- Idempotent column adds for projects on the original schema (none
-- today, but keeps the migration replayable).
alter table public.imessage_users add column if not exists timezone text;
alter table public.imessage_users add column if not exists location text;
alter table public.imessage_users add column if not exists zodiac text;
alter table public.imessage_users add column if not exists model_pref text;
alter table public.imessage_users add column if not exists system_prompt_override text;
alter table public.imessage_users add column if not exists summary text;

alter table public.imessage_users enable row level security;

-- ----------------------------------------------------------------
-- imessage_verifications
-- ----------------------------------------------------------------
create table if not exists public.imessage_verifications (
    sender         text primary key,
    -- SHA-256 of the 6-digit code. We never store the plaintext code.
    code_hash      text not null,
    -- 10 minutes from issue. Expired rows are treated as no-row.
    expires_at     timestamptz not null,
    -- Privy user the start-route caller was signed in as. We pin the
    -- pending verification to that account so a different account
    -- can't hijack a code in flight.
    pending_for    text not null,
    attempts       int not null default 0,
    created_at     timestamptz not null default now()
);

create index if not exists imessage_verifications_expires_at_idx
    on public.imessage_verifications (expires_at);

alter table public.imessage_verifications enable row level security;
