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
    query_price NUMERIC(10,6) DEFAULT 0.001,  -- x402 per-query cost in USDC
    avatar TEXT DEFAULT '',      -- Emoji or URL
    tags TEXT[] DEFAULT '{}',
    rating NUMERIC(3,2) DEFAULT 0,
    installs INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    trending BOOLEAN DEFAULT false,
    -- status: 'stable' = tools wired end-to-end; 'llm_only' = LLM-only
    -- (no external tools wired yet; still useful for Q&A); 'beta' = unstable
    status TEXT DEFAULT 'stable',
    published_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Backwards-compat for existing tables created without `status`
ALTER TABLE agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'stable';

CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_author ON agents(author_id);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read agents" ON agents FOR SELECT USING (true);

-- Seed agents from uplift.exe library.
-- Only agents whose tools map to a real /api/tools/* endpoint are marked
-- 'stable'. Everything else is 'llm_only' — it still answers questions,
-- but doesn't claim to perform external actions yet.
INSERT INTO agents (id, name, description, author, author_id, category, model, system_prompt, tools, status, price, avatar, verified, featured) VALUES
-- Stable (tools wired end-to-end)
('ou-calendar', 'Calendar Triage', 'Reads your Google Calendar, finds conflicts, and suggests optimal meeting times. Creates events only after you approve.', 'Operator Uplift', 'system', 'Productivity', 'claude-sonnet-4-6', 'You are a calendar management assistant. Read the user''s calendar, identify conflicts, suggest better times, and draft agenda items. Use the calendar tool to act.', '{calendar}', 'stable', 'free', '📅', true, true),
('ou-gmail-draft', 'Gmail Drafter', 'Reads your Gmail inbox and drafts professional replies. Never sends without approval.', 'Operator Uplift', 'system', 'Communication', 'claude-sonnet-4-6', 'You are an email drafting assistant. Read the user''s recent emails, draft professional replies, and present them for approval before sending.', '{gmail}', 'stable', 'free', '✉️', true, true),
('ou-x402', 'X402 Payment Agent', 'Handles HTTP 402 payment-required API calls via Solana Pay. Pay-per-query for premium APIs.', 'Operator Uplift', 'system', 'Finance', 'claude-sonnet-4-6', 'You are a payment agent that handles HTTP 402 responses. When an API requires payment, negotiate the payment via Solana Pay and retry with proof.', '{x402}', 'stable', 'pro', '💳', true, false),
-- LLM-only (no external tools wired — useful for Q&A and reasoning)
('ou-research', 'Research Agent', 'Answers research questions using the model''s knowledge. Web search tool is on the roadmap.', 'Operator Uplift', 'system', 'Research', 'claude-sonnet-4-6', 'You are a research assistant. Answer using your trained knowledge, cite publicly available sources, and flag when information is outdated. Do not claim to have browsed the web.', '{}', 'llm_only', 'free', '🔬', true, false),
('ou-code-review', 'Code Reviewer', 'Reviews code you paste in for bugs, security issues, and best practices. No repo access yet.', 'Operator Uplift', 'system', 'Development', 'claude-sonnet-4-6', 'You are a senior code reviewer. The user will paste code snippets. Review them for bugs, security vulnerabilities, performance, and style. Do not claim to read files from their system.', '{}', 'llm_only', 'free', '🔍', true, false),
('ou-security', 'Security Advisor', 'Explains the audit log and security posture. Read-only analysis of the data the Security page shows.', 'Operator Uplift', 'system', 'Security', 'claude-sonnet-4-6', 'You are a security advisor. The user may share their audit log. Analyze it for patterns. You cannot execute actions — recommend manual steps.', '{}', 'llm_only', 'free', '🛡️', true, false),
('ou-crypto', 'Crypto Advisor', 'Explains Solana concepts, reads wallet addresses, and drafts transactions for manual review. Does not sign.', 'Operator Uplift', 'system', 'Finance', 'claude-sonnet-4-6', 'You are a crypto advisor on Solana. Explain concepts, interpret wallet addresses, and help the user draft transactions. You cannot sign — they must do that.', '{}', 'llm_only', 'free', '💰', true, true),
('ou-weather', 'Weather Agent', 'Knowledge-only weather agent. Explains climate patterns and seasons. Live forecast API is on the roadmap.', 'Operator Uplift', 'system', 'Utility', 'claude-sonnet-4-6', 'You are a weather assistant. Explain climate patterns and seasonal norms based on your training data. Clearly state you cannot access live forecasts.', '{}', 'llm_only', 'free', '🌤️', true, false),
('ou-finance', 'Finance Advisor', 'Explains budgeting concepts and analyzes transactions you paste in. No bank connection yet.', 'Operator Uplift', 'system', 'Finance', 'claude-sonnet-4-6', 'You are a personal finance advisor. Analyze transactions the user pastes in. Do not claim to access bank accounts.', '{}', 'llm_only', 'free', '💵', true, false),
('ou-news', 'News Explainer', 'Explains news topics and historical context using the model''s training data. Live feed is on the roadmap.', 'Operator Uplift', 'system', 'Research', 'claude-sonnet-4-6', 'You are a news explainer. Provide historical context on topics using your training data. Clearly state your knowledge cutoff.', '{}', 'llm_only', 'free', '📰', true, false),
('ou-task', 'Task Planner', 'Breaks down tasks and creates checklists. Works alongside your external task manager.', 'Operator Uplift', 'system', 'Productivity', 'claude-sonnet-4-6', 'You are a task planning assistant. Break goals into actionable steps. You cannot write to external task managers — output plain lists.', '{}', 'llm_only', 'free', '✅', true, false),
('ou-file', 'File Advisor', 'Discusses file organization strategies. Local filesystem access is on the roadmap.', 'Operator Uplift', 'system', 'Productivity', 'claude-sonnet-4-6', 'You are a file organization advisor. Suggest folder structures and naming conventions. You cannot browse the user''s filesystem.', '{}', 'llm_only', 'free', '📁', true, false),
('ou-browser', 'Browser Advisor', 'Discusses web research strategies. Live browsing is on the roadmap.', 'Operator Uplift', 'system', 'Research', 'claude-sonnet-4-6', 'You are a web research advisor. Suggest search strategies and sources. Do not claim to have browsed pages.', '{}', 'llm_only', 'free', '🌐', true, false),
('ou-privacy', 'Privacy Advisor', 'Explains privacy concepts, Zcash, shielded transactions. Does not execute transactions.', 'Operator Uplift', 'system', 'Security', 'claude-sonnet-4-6', 'You are a privacy advisor. Explain privacy-preserving techniques. You cannot execute shielded transactions — recommend the user use a Zcash wallet directly.', '{}', 'llm_only', 'pro', '🔒', true, false),
('ou-system', 'System Advisor', 'Explains system diagnostics concepts. Live system access is on the roadmap.', 'Operator Uplift', 'system', 'Utility', 'claude-sonnet-4-6', 'You are a system diagnostics advisor. Explain concepts like memory pressure, CPU load, disk I/O. You cannot read live metrics.', '{}', 'llm_only', 'free', '⚙️', true, false)
ON CONFLICT (id) DO NOTHING;
