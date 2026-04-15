-- Supabase migration: audit_roots table
-- Stores on-chain Merkle root publication records

CREATE TABLE IF NOT EXISTS audit_roots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    merkle_root TEXT NOT NULL,
    action_count INTEGER NOT NULL,
    tx_signature TEXT NOT NULL,
    published_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)  -- One active root per user (overwritten on each publish)
);

CREATE INDEX IF NOT EXISTS idx_audit_roots_user ON audit_roots(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_roots_tx ON audit_roots(tx_signature);

ALTER TABLE audit_roots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read audit roots" ON audit_roots FOR SELECT USING (true);
