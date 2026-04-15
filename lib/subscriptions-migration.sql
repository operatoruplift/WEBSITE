-- Subscriptions table — tracks Pro subscriptions for paywall gating.
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,                     -- Privy DID (did:privy:...)
    tier TEXT NOT NULL DEFAULT 'free',         -- 'free' | 'pro' | 'enterprise'
    status TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'cancelled' | 'expired' | 'past_due'
    price_usdc NUMERIC(10,2) DEFAULT 19.00,   -- Monthly price in USDC
    tx_signature TEXT,                         -- Solana Pay tx signature for payment proof
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
