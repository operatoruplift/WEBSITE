# Waitlist migration runbook

> **Audience:** the operator (you) applying the Supabase schema migration to
> production. **Time:** ~3 minutes. **Reversibility:** every statement is
> idempotent + additive, no data loss.

## What this fixes

As of 2026-06-04, the live `waitlist` table only carries:

```
id           uuid PRIMARY KEY
email        text NOT NULL UNIQUE
created_at   timestamptz
```

The application code in `lib/waitlist.ts` expects ten additional columns
(`position`, `source`, `skip_paid_usdc`, `skip_tx_signature`,
`skip_paid_at`, `wallet_address`, `tier`, `founder_tx`, `founder_chain`,
`founder_amount`, `founder_paid_at`, `perks`).

PR #794 added graceful-fallback paths so the missing columns do not break
the waitlist or Founder Member flow. But the fallback keeps `position`
rendered as `0` for every signup, and the Founder Member tx-replay guard
from PR #790 only works when `founder_tx` exists. Applying the
consolidated migration is the long-term fix.

## How to run

1. Open Supabase → your project → **SQL Editor** → **New query**.
2. Copy the entire file `lib/waitlist-consolidated-migration.sql` into
   the editor.
3. Click **Run**. Every statement uses `IF NOT EXISTS` so re-running on a
   table that has some columns is safe.
4. After the run, refresh the Table Editor and confirm `waitlist` shows
   the new columns (`position`, `source`, `tier`, `founder_*`, etc.).

## Verify on prod

```bash
# Should now show non-zero position
curl -s -X POST https://www.operatoruplift.com/api/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"email":"post-migration-check@example.com","source":"post-migration"}' | jq

# Should show founder=0 unless a Founder Member has signed up
curl -s https://www.operatoruplift.com/api/waitlist/counts | jq
```

A successful migration moves the `position` field on new signups from `0`
to a real sequence value (default starts at 301, see
`lib/waitlist-position-migration.sql`).

## What this does NOT do

This runbook does NOT:

- Move the existing 21+ rows from `id + email + created_at` shape to the
  new shape. Those rows keep their existing columns (other columns get
  the defaults). No data migration is needed because every column added
  is nullable or has a default.
- Reset the position sequence. New signups get the next sequence value;
  existing rows have `position = NULL` until you backfill them. To
  backfill, run the optional `lib/waitlist-position-migration.sql` after
  the consolidated file.

## Rollback

Every column is additive. To remove them after a botched application:

```sql
ALTER TABLE waitlist
    DROP COLUMN IF EXISTS position,
    DROP COLUMN IF EXISTS source,
    DROP COLUMN IF EXISTS skip_paid_usdc,
    DROP COLUMN IF EXISTS skip_tx_signature,
    DROP COLUMN IF EXISTS skip_paid_at,
    DROP COLUMN IF EXISTS wallet_address,
    DROP COLUMN IF EXISTS tier,
    DROP COLUMN IF EXISTS founder_tx,
    DROP COLUMN IF EXISTS founder_chain,
    DROP COLUMN IF EXISTS founder_amount,
    DROP COLUMN IF EXISTS founder_paid_at,
    DROP COLUMN IF EXISTS perks;

DROP SEQUENCE IF EXISTS waitlist_position_seq;
DROP FUNCTION IF EXISTS nextval_text;
```

The app code degrades gracefully back to the missing-column state.

## Related PRs

- PR #770 — public `/api/waitlist/counts` route
- PR #790 — Founder tx-replay guard (depends on `founder_tx` column for
  full coverage; degrades gracefully when missing)
- PR #794 — schema-fallback in `joinWaitlist` + `lookupByEmail` so the
  app works against either the old or new schema
