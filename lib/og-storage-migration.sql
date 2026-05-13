-- 0G Storage receipt-anchor migration.
-- Adds og_storage_root_hash + og_storage_anchored_at columns to
-- tool_receipts so the cron at /api/cron/og-anchor can record the
-- 0G Storage rootHash for each signed receipt. Companion to the
-- Filecoin anchor migration (lib/filecoin-anchor-migration.sql);
-- the two networks coexist per row.
--
-- The rootHash is stored OUTSIDE the signed payload. Adding it to
-- ReceiptPayload would break the canonical signature contract that
-- /docs/receipts (PR #510) and lib/x402/receipts.ts agree on.
-- Anchoring is provenance metadata, not part of the signed receipt.
--
-- Run this in the Supabase SQL editor.

ALTER TABLE tool_receipts
    ADD COLUMN IF NOT EXISTS og_storage_root_hash    TEXT,
    ADD COLUMN IF NOT EXISTS og_storage_anchored_at  TIMESTAMPTZ;

-- Hot path index: cron picks up un-anchored rows oldest-first.
CREATE INDEX IF NOT EXISTS idx_tool_receipts_og_unanchored
    ON tool_receipts(created_at)
    WHERE og_storage_root_hash IS NULL;

-- Optional: index on the rootHash for the verification UI lookup
-- (`SELECT * WHERE og_storage_root_hash = $1`).
CREATE INDEX IF NOT EXISTS idx_tool_receipts_og_root_hash
    ON tool_receipts(og_storage_root_hash)
    WHERE og_storage_root_hash IS NOT NULL;
