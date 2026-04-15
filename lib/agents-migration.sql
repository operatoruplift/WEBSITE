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
    published_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_author ON agents(author_id);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read agents" ON agents FOR SELECT USING (true);

-- Seed all agents from uplift.exe Electron app library
INSERT INTO agents (id, name, description, author, author_id, category, model, system_prompt, tools, price, avatar, verified, featured) VALUES
('ou-calendar', 'Calendar Triage', 'Checks your calendar, finds conflicts, and suggests optimal meeting times. Runs daily at 8 AM.', 'Operator Uplift', 'system', 'Productivity', 'claude-sonnet-4-6', 'You are a calendar management assistant. Check the user''s calendar, identify conflicts, suggest better times, and draft agenda items.', '{calendar}', 'free', '📅', true, true),
('ou-gmail-draft', 'Gmail Drafter', 'Drafts professional email replies based on context and conversation history. Never sends without approval.', 'Operator Uplift', 'system', 'Communication', 'claude-sonnet-4-6', 'You are an email drafting assistant. Read the user''s recent emails, draft professional replies, and present them for approval before sending.', '{gmail}', 'free', '✉️', true, true),
('ou-research', 'Research Agent', 'Deep research across web sources with citations. Synthesizes findings into concise reports.', 'Operator Uplift', 'system', 'Research', 'claude-sonnet-4-6', 'You are a research assistant. Search the web, academic papers, and documentation. Always cite your sources. Produce concise, evidence-based reports.', '{web-search}', 'free', '🔬', true, false),
('ou-code-review', 'Code Reviewer', 'Reviews code for bugs, security issues, and best practices. Suggests fixes with explanations.', 'Operator Uplift', 'system', 'Development', 'claude-sonnet-4-6', 'You are a senior code reviewer. Review code for bugs, security vulnerabilities, performance issues, and style. Provide specific fix suggestions.', '{code-exec,github}', 'free', '🔍', true, false),
('ou-security', 'Security Monitor', 'Monitors agent actions for anomalies, unauthorized access patterns, and policy violations.', 'Operator Uplift', 'system', 'Security', 'claude-sonnet-4-6', 'You are a security monitoring agent. Review the audit log for anomalies, flag unauthorized access patterns, and report policy violations.', '{}', 'free', '🛡️', true, false),
('ou-file', 'File Agent', 'Find, open, and manage documents and files. Searches Downloads, Desktop, and project folders.', 'Operator Uplift', 'system', 'Productivity', 'claude-sonnet-4-6', 'You are a file management assistant. Help users find, organize, and manage their local files and documents.', '{}', 'free', '📁', true, false),
('ou-browser', 'Browser Agent', 'Search the web, extract content from URLs, summarize pages, and manage browser tasks.', 'Operator Uplift', 'system', 'Research', 'claude-sonnet-4-6', 'You are a web browsing assistant. Search the web, extract and summarize content from URLs, and help with browser-related tasks.', '{web-search}', 'free', '🌐', true, false),
('ou-crypto', 'Crypto Agent', 'Check Solana wallet balances, monitor token prices, and prepare transfer transactions.', 'Operator Uplift', 'system', 'Finance', 'claude-sonnet-4-6', 'You are a crypto wallet assistant on Solana. Check balances, monitor SOL and USDC prices, and help prepare transactions. Never execute transfers without explicit approval.', '{}', 'free', '💰', true, true),
('ou-weather', 'Weather Agent', 'Get current weather and forecasts for any location. Suggests what to wear.', 'Operator Uplift', 'system', 'Utility', 'claude-sonnet-4-6', 'You are a weather assistant. Provide current conditions, forecasts, and practical advice like what to wear.', '{}', 'free', '🌤️', true, false),
('ou-finance', 'Finance Agent', 'Track spending, analyze budgets, and categorize transactions across bank accounts.', 'Operator Uplift', 'system', 'Finance', 'claude-sonnet-4-6', 'You are a personal finance assistant. Help users track spending, analyze budgets, and categorize transactions.', '{}', 'free', '💵', true, false),
('ou-news', 'News Agent', 'Daily news briefing with headlines from tech, crypto, AI, and global markets.', 'Operator Uplift', 'system', 'Research', 'claude-sonnet-4-6', 'You are a news briefing assistant. Summarize the top headlines across tech, crypto, AI, and markets. Be concise and factual.', '{web-search}', 'free', '📰', true, false),
('ou-task', 'Task Agent', 'Manage todos, set reminders, and track task completion across projects.', 'Operator Uplift', 'system', 'Productivity', 'claude-sonnet-4-6', 'You are a task management assistant. Help users manage todos, set reminders, and track task completion.', '{}', 'free', '✅', true, false),
('ou-x402', 'X402 Payment Agent', 'Handle HTTP 402 payment-required API calls via Solana Pay. Pay-per-query for premium APIs.', 'Operator Uplift', 'system', 'Finance', 'claude-sonnet-4-6', 'You are a payment agent that handles HTTP 402 responses. When an API requires payment, negotiate the payment via Solana Pay and retry with proof.', '{x402}', 'pro', '💳', true, false),
('ou-privacy', 'Privacy Agent', 'Zcash shielded transactions, privacy scoring, and anonymous data handling.', 'Operator Uplift', 'system', 'Security', 'claude-sonnet-4-6', 'You are a privacy-focused assistant. Help users with shielded transactions, privacy scoring, and anonymous operations.', '{}', 'pro', '🔒', true, false),
('ou-system', 'System Agent', 'Monitor battery, WiFi, disk, CPU, RAM, and running processes. System diagnostics.', 'Operator Uplift', 'system', 'Utility', 'claude-sonnet-4-6', 'You are a system monitoring assistant. Report on battery, WiFi, disk usage, CPU, RAM, and running processes.', '{}', 'free', '⚙️', true, false)
ON CONFLICT (id) DO NOTHING;
