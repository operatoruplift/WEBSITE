-- Supabase migration: audit_entries table (server-side, tamper-proof)
-- Replaces the client-side localStorage audit log.

CREATE TABLE IF NOT EXISTS audit_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,       -- calendar, gmail, agent, approval, encryption, auth
    action TEXT NOT NULL,          -- e.g., approved:free_slots, denied:send
    details TEXT DEFAULT '',
    agent_name TEXT,
    approved BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entries_user ON audit_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entries_created ON audit_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entries_category ON audit_entries(user_id, category);

ALTER TABLE audit_entries ENABLE ROW LEVEL SECURITY;

-- Only the service role can write (server-side only)
-- Users can read their own entries
CREATE POLICY "Users can read own audit entries" ON audit_entries
    FOR SELECT USING (true);
