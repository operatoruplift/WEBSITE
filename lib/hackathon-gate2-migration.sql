-- Loops House Hackathon — Gate 2 migration.
-- Adds tool_invoices + tool_receipts tables used by the x402 payment
-- middleware on /api/tools/calendar and /api/tools/gmail.
--
-- Run this in the Supabase SQL editor.

-- ─────────────────────────────────────────────────────────────
-- tool_invoices — one row per 402 response. Status goes
-- pending → paid → consumed (after the tool executes once).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_invoices (
    invoice_reference TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    tool              TEXT NOT NULL,              -- 'calendar' | 'gmail'
    action            TEXT NOT NULL,              -- 'create' | 'draft' | 'send' | 'send_draft'
    amount_usdc       NUMERIC(10,4) NOT NULL,
    chain             TEXT NOT NULL DEFAULT 'solana-devnet',
    status            TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | consumed | expired
    params_hash       TEXT,                       -- SHA-256 of the tool params (binds invoice to request)
    tx_signature      TEXT,                       -- set when status becomes 'paid'
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at           TIMESTAMPTZ,
    consumed_at       TIMESTAMPTZ,
    expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_tool_invoices_user ON tool_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_invoices_status ON tool_invoices(status);

-- ─────────────────────────────────────────────────────────────
-- tool_receipts — one row per successful paid execution. This
-- is the "verifiable intelligence artifact" — ed25519-signed
-- JSON the user can export to prove an action happened.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tool_receipts (
    receipt_reference  TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL,
    agent_id           TEXT,
    tool               TEXT NOT NULL,
    action             TEXT NOT NULL,
    params_hash        TEXT NOT NULL,
    result_hash        TEXT NOT NULL,
    invoice_reference  TEXT NOT NULL REFERENCES tool_invoices(invoice_reference),
    amount_usdc        NUMERIC(10,4) NOT NULL,
    chain              TEXT NOT NULL,
    payment_tx         TEXT NOT NULL,
    signature          TEXT NOT NULL,             -- base64 ed25519 signature over the canonical JSON
    public_key         TEXT NOT NULL,             -- base64 ed25519 public key
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_receipts_user ON tool_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_receipts_invoice ON tool_receipts(invoice_reference);

-- RLS — every user sees their own rows only
ALTER TABLE tool_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_receipts ENABLE ROW LEVEL SECURITY;

-- Read policy (user's own rows via auth.uid() OR service-role bypass)
CREATE POLICY "user reads own invoices"
  ON tool_invoices FOR SELECT
  USING (user_id = COALESCE(auth.uid()::text, user_id));

CREATE POLICY "user reads own receipts"
  ON tool_receipts FOR SELECT
  USING (user_id = COALESCE(auth.uid()::text, user_id));
