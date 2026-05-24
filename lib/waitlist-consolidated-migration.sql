-- waitlist-consolidated-migration.sql
--
-- Brings a fresh or partially-migrated Supabase `waitlist` table to
-- the full schema needed by the v3 lib (lib/waitlist.ts). Idempotent:
-- every CREATE / ALTER uses IF NOT EXISTS so re-running is safe.
--
-- Run order from a fresh project:
--   1. Create the table (if missing)
--   2. Add the position column + sequence (skip if you didn't run
--      lib/waitlist-position-migration.sql)
--   3. Add the skip-the-line columns
--   4. Add the Founder Member tier columns
--   5. Add indexes
--
-- After running this once on Supabase, `joinWaitlist` and
-- `markFounder` (lib/waitlist.ts) will write rows with full
-- semantics. The graceful-fallback paths in those helpers stay in
-- place as a safety net for future migration drift.

-- 1. Base table -------------------------------------------------------
CREATE TABLE IF NOT EXISTS waitlist (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Position column + sequence ---------------------------------------
-- The sequence starts at 301 so positions read like cohort 301+,
-- not 1-indexed (300 was the seed waitlist before public launch).
CREATE SEQUENCE IF NOT EXISTS waitlist_position_seq START WITH 301;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS position integer;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS source text;

-- nextval_text helper. The lib expects an RPC that returns the
-- next sequence value as text (Supabase RPCs default to text for
-- sequence reads). If the function already exists, this is a no-op.
CREATE OR REPLACE FUNCTION nextval_text(seq_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    next_val bigint;
BEGIN
    EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
    RETURN next_val::text;
END;
$$;

-- 3. Skip-the-line columns (boost / jump-top tiers) -------------------
ALTER TABLE waitlist
    ADD COLUMN IF NOT EXISTS skip_paid_usdc numeric NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS skip_tx_signature text,
    ADD COLUMN IF NOT EXISTS skip_paid_at timestamptz,
    ADD COLUMN IF NOT EXISTS wallet_address text;

-- 4. Founder Member tier columns --------------------------------------
ALTER TABLE waitlist
    ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS founder_tx text,
    ADD COLUMN IF NOT EXISTS founder_chain text,
    ADD COLUMN IF NOT EXISTS founder_amount numeric,
    ADD COLUMN IF NOT EXISTS founder_paid_at timestamptz,
    ADD COLUMN IF NOT EXISTS perks jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS waitlist_tier_check;
ALTER TABLE waitlist
    ADD CONSTRAINT waitlist_tier_check
    CHECK (tier IN ('free', 'founder'));

-- 5. Indexes ----------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_uniq
    ON waitlist (lower(email));
CREATE INDEX IF NOT EXISTS waitlist_position_idx
    ON waitlist (position);
CREATE INDEX IF NOT EXISTS waitlist_tier_idx ON waitlist (tier);
CREATE INDEX IF NOT EXISTS waitlist_founder_paid_at_idx
    ON waitlist (founder_paid_at DESC NULLS LAST)
    WHERE tier = 'founder';
CREATE INDEX IF NOT EXISTS waitlist_founder_tx_idx
    ON waitlist (founder_tx) WHERE founder_tx IS NOT NULL;

-- 6. Backfill missing positions ---------------------------------------
-- Any rows that landed before the position column existed (via the
-- graceful-fallback path in lib/waitlist.ts) get sequential positions
-- assigned in insert order.
UPDATE waitlist
SET position = nextval('waitlist_position_seq')
WHERE position IS NULL;
