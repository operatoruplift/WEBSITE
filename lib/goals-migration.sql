-- Goals + daily check-ins migration (Gamify Your Growth, Phase 8)
--
-- Two-table schema for the MVP:
--
--   goals          One row per ambition an operator commits to.
--                  Owned by the Privy user (privy_id).
--                  Carries the title, optional stakes, the AI-generated
--                  questline JSON, status, target_date, and timestamps.
--
--   goal_checkins  One row per daily check-in against a goal.
--                  Idempotent on (goal_id, checkin_date) so a double-tap
--                  cannot inflate the streak.
--
-- RLS is on for both tables. Server-side calls authenticate with the
-- Privy JWT (verifySession in lib/auth.ts) and read the user's privy_id
-- before issuing the query, so we never trust client-provided ids.
--
-- Idempotent: running this twice is a no-op. Safe to apply against
-- production once the schema is reviewed.

-- 1. goals table
CREATE TABLE IF NOT EXISTS goals (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    privy_id       TEXT         NOT NULL,
    title          TEXT         NOT NULL,
    -- Optional stakes the operator sets for themselves; freeform text
    -- because the semantics ("$20 to a friend if I miss a week") vary.
    stakes         TEXT,
    -- AI-generated questline: array of {day, action, notes}. JSON so
    -- the shape can evolve without a migration; lib/goals/types.ts is
    -- the canonical schema.
    questline      JSONB        NOT NULL DEFAULT '[]'::jsonb,
    -- 'active' | 'paused' | 'completed' | 'abandoned'
    status         TEXT         NOT NULL DEFAULT 'active',
    target_date    DATE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_privy_id_idx
    ON goals (privy_id, created_at DESC);

CREATE INDEX IF NOT EXISTS goals_status_idx
    ON goals (privy_id, status);

-- 2. goal_checkins table
CREATE TABLE IF NOT EXISTS goal_checkins (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id        UUID         NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    privy_id       TEXT         NOT NULL,
    -- Calendar date (in user's local timezone, server normalizes) so
    -- a single check-in per day is enforced via the unique index below.
    checkin_date   DATE         NOT NULL,
    -- 'done' | 'partial' | 'skipped'
    status         TEXT         NOT NULL DEFAULT 'done',
    note           TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- One check-in per (goal, date). A second tap on the same day updates
-- the existing row rather than creating a duplicate; the API enforces
-- this with an ON CONFLICT clause.
CREATE UNIQUE INDEX IF NOT EXISTS goal_checkins_unique_per_day
    ON goal_checkins (goal_id, checkin_date);

CREATE INDEX IF NOT EXISTS goal_checkins_privy_id_idx
    ON goal_checkins (privy_id, checkin_date DESC);

-- 3. RLS
ALTER TABLE goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_checkins  ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the policies so the migration is idempotent against
-- earlier iterations.
DROP POLICY IF EXISTS goals_owner_select       ON goals;
DROP POLICY IF EXISTS goals_owner_insert       ON goals;
DROP POLICY IF EXISTS goals_owner_update       ON goals;
DROP POLICY IF EXISTS goals_owner_delete       ON goals;
DROP POLICY IF EXISTS checkins_owner_select    ON goal_checkins;
DROP POLICY IF EXISTS checkins_owner_insert    ON goal_checkins;
DROP POLICY IF EXISTS checkins_owner_update    ON goal_checkins;

-- The service role is the only client that touches these tables today.
-- Every API route resolves the Privy user server-side and inserts the
-- privy_id explicitly, so the policy is "service role can read/write
-- anything; everyone else is locked out." When/if we expose a client
-- SDK that authenticates as the user, the policies tighten to
-- (auth.uid()::text = privy_id) and the API stops setting privy_id
-- by hand.

CREATE POLICY goals_owner_select      ON goals          FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY goals_owner_insert      ON goals          FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY goals_owner_update      ON goals          FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY goals_owner_delete      ON goals          FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY checkins_owner_select   ON goal_checkins  FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY checkins_owner_insert   ON goal_checkins  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY checkins_owner_update   ON goal_checkins  FOR UPDATE USING (auth.role() = 'service_role');

-- 4. updated_at trigger on goals so the dashboard can sort by recent
-- activity without inferring it from the latest check-in.
CREATE OR REPLACE FUNCTION goals_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS goals_set_updated_at_trigger ON goals;
CREATE TRIGGER goals_set_updated_at_trigger
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION goals_set_updated_at();
