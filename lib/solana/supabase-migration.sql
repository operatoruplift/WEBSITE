-- Supabase migration: early_access table
-- Run in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS early_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    user_id TEXT,                        -- Privy user ID, nullable
    email TEXT,                          -- optional email for notifications
    tx_signature TEXT NOT NULL,          -- Solana transaction signature (proof of payment)
    amount_sol NUMERIC(10, 4) DEFAULT 0.1,
    granted_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ              -- null = active
);

CREATE INDEX IF NOT EXISTS idx_early_access_wallet
    ON early_access(wallet_address);

-- Add 'approved' column to existing waitlist table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'approved'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN approved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- RLS: public read for access checks, service-role writes
ALTER TABLE early_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check access"
    ON early_access FOR SELECT
    USING (true);

-- No INSERT/UPDATE for anon — all writes via service role key in verify-payment route
