-- waitlist-founder-tier-migration.sql
--
-- Adds a Founder Member tier to the existing waitlist table. Founder
-- Members pay $5 USDC at signup; in exchange they get a vanity badge
-- visible on their dashboard once they sign in with the same email,
-- plus a +500 XP head start banked against their first session.
--
-- Schema additions (both nullable, default to free-tier values):
--
--   tier             text NOT NULL DEFAULT 'free'   -- 'free' | 'founder'
--   founder_tx       text                            -- on-chain payment signature
--   founder_chain    text                            -- 'solana' | 'base' | 'arbitrum' | etc.
--   founder_amount   numeric                         -- amount paid in USD (5.00)
--   founder_paid_at  timestamptz                     -- timestamp of confirmed payment
--   perks            jsonb NOT NULL DEFAULT '{}'::jsonb
--                    -- { vanity_badge: true, xp_head_start: 500 } for founders
--
-- The existing skip_paid_usdc / skip_tx_signature / wallet_address
-- columns stay in place for the original skip-the-line mechanic which
-- is orthogonal to the Founder tier perk system.
--
-- Idempotent: every ALTER TABLE uses IF NOT EXISTS so re-running is
-- safe.

ALTER TABLE waitlist
    ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS founder_tx text,
    ADD COLUMN IF NOT EXISTS founder_chain text,
    ADD COLUMN IF NOT EXISTS founder_amount numeric,
    ADD COLUMN IF NOT EXISTS founder_paid_at timestamptz,
    ADD COLUMN IF NOT EXISTS perks jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Constrain tier values so a stray API call can never insert an
-- off-menu string. CHECK constraint instead of ENUM because
-- CHECK is easier to extend later (e.g. 'lifetime' tier).
ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS waitlist_tier_check;
ALTER TABLE waitlist
    ADD CONSTRAINT waitlist_tier_check
    CHECK (tier IN ('free', 'founder'));

-- Index on founder_paid_at so the dashboard can render a leaderboard
-- of Founder Members in arrival order without a full table scan.
CREATE INDEX IF NOT EXISTS waitlist_founder_paid_at_idx
    ON waitlist (founder_paid_at DESC NULLS LAST)
    WHERE tier = 'founder';

-- Index on tier so count-by-tier queries (free vs founder) stay fast
-- even at 100k+ rows.
CREATE INDEX IF NOT EXISTS waitlist_tier_idx ON waitlist (tier);
