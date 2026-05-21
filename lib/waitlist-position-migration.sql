-- Waitlist position tracking migration
--
-- Adds sequential position assignment to the waitlist table so every
-- signup gets a stable, displayable place in line. New signups start
-- at position 300+1 = 301; existing rows get migrated to positions
-- 301..N in created_at order (oldest first).
--
-- Skip-the-line columns track the operator-side product where paying
-- bumps your position. Three tiers (locked in lib/waitlist.ts):
--   $25  -> bump 50 spots
--   $50  -> bump 200 spots
--   $100 -> jump to position 1 (collision rules below)
--
-- Idempotent: running this twice is a no-op. Safe to apply against
-- production.

-- 1. Add the columns if they don't exist.
DO $$
BEGIN
    -- Sequential public-facing position. Starts at 301.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'position'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN position INTEGER UNIQUE;
    END IF;

    -- How much USDC the user paid to skip the line (lifetime total).
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'skip_paid_usdc'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN skip_paid_usdc NUMERIC(10, 2) DEFAULT 0;
    END IF;

    -- Last skip-line Solana transaction signature (audit trail).
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'skip_tx_signature'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN skip_tx_signature TEXT;
    END IF;

    -- When the last skip-line payment cleared.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'skip_paid_at'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN skip_paid_at TIMESTAMPTZ;
    END IF;

    -- Wallet address used for the skip-line payment (so we can verify
    -- the same wallet on future bumps).
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'wallet_address'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN wallet_address TEXT;
    END IF;
END $$;

-- 2. Sequence that the application reads via nextval() to assign new
-- positions. Starts at 301 so the public-facing list reads "300+",
-- never "1, 2, 3". The +1 also leaves position 300 as the operator-
-- reserved bookmark (used in /admin to confirm the migration ran).
CREATE SEQUENCE IF NOT EXISTS waitlist_position_seq START WITH 301;

-- 3. Backfill: assign positions to existing rows in created_at order
-- (oldest first), starting at 301. Only touches rows where position
-- is NULL, so re-running is a no-op.
WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
    FROM waitlist
    WHERE position IS NULL
)
UPDATE waitlist w
SET position = 300 + ordered.rn
FROM ordered
WHERE w.id = ordered.id;

-- 4. Advance the sequence past the highest assigned position so the
-- next nextval() returns the right value. setval(..., last_value,
-- true) means "the next call to nextval() returns last_value + 1."
DO $$
DECLARE
    max_pos INTEGER;
BEGIN
    SELECT COALESCE(MAX(position), 300) INTO max_pos FROM waitlist;
    PERFORM setval('waitlist_position_seq', max_pos, true);
END $$;

-- 5. Index for fast position lookups + ordering on the public page.
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist (position);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);
