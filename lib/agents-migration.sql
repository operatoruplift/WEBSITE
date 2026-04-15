-- Supabase migration: agents table
-- Replaces the hardcoded DEMO_AGENTS in marketplace/page.tsx.
-- Stores agent manifests (name, description, version, tools, permissions, price).
--
-- If the table already exists from an older migration, drop it first.
-- The seeds below will re-populate it.
DROP TABLE IF EXISTS agents CASCADE;

CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    author TEXT NOT NULL,
    author_id TEXT,              -- Privy user ID of the publisher
    category TEXT NOT NULL,
    model TEXT DEFAULT 'claude-sonnet-4-6',
    system_prompt TEXT DEFAULT '',
    tools TEXT[] DEFAULT '{}',   -- Tool IDs from the builder (calendar, gmail, web-search, etc.)
    permissions TEXT[] DEFAULT '{}',  -- Required permissions
    price TEXT DEFAULT 'free',   -- 'free', 'pro', 'enterprise'
    avatar TEXT DEFAULT '',      -- Emoji or URL
    tags TEXT[] DEFAULT '{}',
    rating NUMERIC(3,2) DEFAULT 0,
    installs INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    trending BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_author ON agents(author_id);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read agents" ON agents FOR SELECT USING (true);

-- Seed the 5 first-party agents
INSERT INTO agents (id, name, description, author, author_id, category, model, system_prompt, tools, price, avatar, verified, featured) VALUES
('ou-calendar', 'Calendar Triage', 'Checks your calendar, finds conflicts, and suggests optimal meeting times. Runs daily at 8 AM.', 'Operator Uplift', 'system', 'Productivity', 'claude-sonnet-4-6', 'You are a calendar management assistant. Check the user''s calendar, identify conflicts, suggest better times, and draft agenda items.', '{calendar}', 'free', '📅', true, true),
('ou-gmail-draft', 'Gmail Drafter', 'Drafts professional email replies based on context and conversation history. Never sends without approval.', 'Operator Uplift', 'system', 'Communication', 'claude-sonnet-4-6', 'You are an email drafting assistant. Read the user''s recent emails, draft professional replies, and present them for approval before sending.', '{gmail}', 'free', '✉️', true, true),
('ou-research', 'Research Agent', 'Deep research across web sources with citations. Synthesizes findings into concise reports.', 'Operator Uplift', 'system', 'Research', 'claude-sonnet-4-6', 'You are a research assistant. Search the web, academic papers, and documentation. Always cite your sources. Produce concise, evidence-based reports.', '{web-search}', 'free', '🔬', true, false),
('ou-code-review', 'Code Reviewer', 'Reviews code for bugs, security issues, and best practices. Suggests fixes with explanations.', 'Operator Uplift', 'system', 'Development', 'claude-sonnet-4-6', 'You are a senior code reviewer. Review code for bugs, security vulnerabilities, performance issues, and style. Provide specific fix suggestions.', '{code-exec,github}', 'free', '🔍', true, false),
('ou-security', 'Security Monitor', 'Monitors agent actions for anomalies, unauthorized access patterns, and policy violations.', 'Operator Uplift', 'system', 'Security', 'claude-sonnet-4-6', 'You are a security monitoring agent. Review the audit log for anomalies, flag unauthorized access patterns, and report policy violations.', '{}', 'free', '🛡️', true, false)
ON CONFLICT (id) DO NOTHING;
