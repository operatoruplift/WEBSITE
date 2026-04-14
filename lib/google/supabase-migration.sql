-- Supabase migration: user_integrations table
-- Run this in the Supabase SQL editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
-- or via the Supabase CLI: supabase db push

CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,              -- 'google', 'notion', 'github', etc.
    refresh_token TEXT,                  -- encrypted at the app layer before storage
    access_token TEXT,                   -- short-lived, refreshed automatically
    token_expiry TIMESTAMPTZ,
    scopes TEXT,                         -- space-separated scope list
    connected_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- One row per user per provider
    UNIQUE(user_id, provider)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_integrations_user
    ON user_integrations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_integrations_provider
    ON user_integrations(provider);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security: users can only read their own integrations
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid() = user_id);

-- Service role (backend) can do everything — used by lib/google/oauth.ts
-- No INSERT/UPDATE/DELETE policies for anon/authenticated — all writes go through the service role key
