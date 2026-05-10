-- Filecoin receipt-anchor migration.
-- Adds filecoin_cid + filecoin_anchored_at columns to tool_receipts so
-- the cron at /api/cron/filecoin-anchor can record where a receipt was
-- pushed.
--
-- The CID is stored OUTSIDE the signed payload — adding it to
-- ReceiptPayload would break the canonical signature contract that
-- /docs/receipts (PR #510) and lib/x402/receipts.ts agree on.
-- Anchoring is provenance metadata, not part of the signed receipt.
--
-- Run this in the Supabase SQL editor.

ALTER TABLE tool_receipts
    ADD COLUMN IF NOT EXISTS filecoin_cid          TEXT,
    ADD COLUMN IF NOT EXISTS filecoin_provider     TEXT,
    ADD COLUMN IF NOT EXISTS filecoin_anchored_at  TIMESTAMPTZ;

-- Hot path index: cron picks up un-anchored rows ordered by created_at.
CREATE INDEX IF NOT EXISTS idx_tool_receipts_unanchored
    ON tool_receipts(created_at)
    WHERE filecoin_cid IS NULL;

-- Optional: index on the CID for the verification UI lookup
-- (`SELECT * WHERE filecoin_cid = $1`).
CREATE INDEX IF NOT EXISTS idx_tool_receipts_filecoin_cid
    ON tool_receipts(filecoin_cid)
    WHERE filecoin_cid IS NOT NULL;
