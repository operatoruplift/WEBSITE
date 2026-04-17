-- ----------------------------------------------------------------
--  Tier 1 tools migration — notes, tasks
--  Apply with:
--    psql "$DATABASE_URL" -f lib/tier1-tools-migration.sql
--  OR in Supabase SQL editor:
--    paste + run.
-- ----------------------------------------------------------------
--
-- User-scoped notes and tasks tables used by the Tier 1 tool routes
-- in /api/tools/notes and /api/tools/tasks. RLS is enabled so each
-- user only sees their own rows.
--
-- `user_id` is the Privy DID (did:privy:...) that lib/auth.ts returns.
-- No FK to a users table — Privy is the source of truth for identity.
-- ----------------------------------------------------------------

create extension if not exists "pgcrypto";

create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    title text,
    body text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists notes_user_id_created_at_idx
    on public.notes (user_id, created_at desc);

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id text not null,
    title text not null,
    due timestamptz,
    status text not null default 'pending' check (status in ('pending', 'done', 'cancelled')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_status_created_at_idx
    on public.tasks (user_id, status, created_at desc);

alter table public.notes enable row level security;
alter table public.tasks enable row level security;

-- RLS: service-role key (used by /api/tools/*) bypasses RLS, so the
-- policies below are for any future anon/authenticated key usage.
do $$ begin
    if not exists (
        select 1 from pg_policies where policyname = 'notes_owner_select' and tablename = 'notes'
    ) then
        create policy notes_owner_select on public.notes
            for select using (user_id = auth.jwt() ->> 'sub');
        create policy notes_owner_mutate on public.notes
            for all using (user_id = auth.jwt() ->> 'sub')
            with check (user_id = auth.jwt() ->> 'sub');
    end if;
    if not exists (
        select 1 from pg_policies where policyname = 'tasks_owner_select' and tablename = 'tasks'
    ) then
        create policy tasks_owner_select on public.tasks
            for select using (user_id = auth.jwt() ->> 'sub');
        create policy tasks_owner_mutate on public.tasks
            for all using (user_id = auth.jwt() ->> 'sub')
            with check (user_id = auth.jwt() ->> 'sub');
    end if;
end $$;
