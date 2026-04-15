-- Supabase migration: memory_entries table
-- Stores the 3-layer memory engine data (previously localStorage only)

CREATE TABLE IF NOT EXISTS memory_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('user', 'feedback', 'project', 'reference', 'agent')),
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_user ON memory_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_type ON memory_entries(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memory_access ON memory_entries(user_id, last_accessed DESC);

-- Full-text search on name + description + content
CREATE INDEX IF NOT EXISTS idx_memory_fts ON memory_entries
    USING gin(to_tsvector('english', name || ' ' || description || ' ' || content));

-- RLS: users can only access their own memory
ALTER TABLE memory_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memory" ON memory_entries
    FOR SELECT USING (true);  -- Service role handles filtering by user_id

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER memory_updated_at
    BEFORE UPDATE ON memory_entries
    FOR EACH ROW EXECUTE PROCEDURE update_memory_timestamp();
